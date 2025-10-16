// 환경에 따른 데이터베이스 선택
const isProduction =
  process.env.NODE_ENV === 'production' || process.env.POSTGRES_URL;

// 데이터베이스 모듈 변수
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sql: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Database: any = null;

// 데이터베이스 모듈 초기화
async function initializeDatabaseModules() {
  if (isProduction) {
    // 프로덕션 환경 또는 Postgres URL이 있는 경우 PostgreSQL 사용
    const { sql: pgSql } = await import('@vercel/postgres');
    sql = pgSql;
  } else {
    // 로컬 개발 환경에서는 SQLite 사용
    const betterSqlite3 = await import('better-sqlite3');
    Database = betterSqlite3.default;
  }
}

// 상품 데이터 타입 정의
export interface ProductData {
  barcode: string;
  productName: string;
  keyword?: string;
  company?: string;
  country?: string;
  category?: string;
  description?: string;
}

// SQLite 관련 변수
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any = null;
import * as path from 'path';
import * as fs from 'fs';

// 데이터베이스 초기화 함수
export async function initializeDatabase() {
  // 모듈 초기화가 되지 않았다면 초기화
  if ((isProduction && !sql) || (!isProduction && !Database)) {
    await initializeDatabaseModules();
  }

  if (isProduction) {
    // PostgreSQL 초기화
    try {
      if (!sql) {
        throw new Error('PostgreSQL module not initialized');
      }
      // 테이블이 없으면 생성
      await sql`
        CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          barcode VARCHAR(13) UNIQUE NOT NULL,
          product_name TEXT NOT NULL,
          keyword TEXT,
          company TEXT,
          country TEXT,
          category TEXT,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;

      // 바코드에 인덱스 생성 (검색 성능 향상)
      await sql`
        CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)
      `;

      // 키워드에 인덱스 생성
      await sql`
        CREATE INDEX IF NOT EXISTS idx_products_keyword ON products(keyword)
      `;

      console.warn('✅ PostgreSQL 데이터베이스 초기화 완료');
      return { success: true };
    } catch (error) {
      console.error('❌ PostgreSQL 데이터베이스 초기화 오류:', error);
      return { success: false, error };
    }
  } else {
    // SQLite 초기화
    try {
      if (!db) {
        // data 디렉토리가 없으면 생성
        const dbPath = path.join(process.cwd(), 'data', 'products.db');
        const dataDir = path.dirname(dbPath);
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }

        db = new Database(dbPath);

        try {
          // WAL 모드 설정 (Write-Ahead Logging) - 동시성 향상
          db.pragma('journal_mode = WAL');
          // 바쁜 타임아웃 설정 (5초)
          db.pragma('busy_timeout = 5000');
        } catch (error) {
          console.warn('SQLite 최적화 설정 실패 (계속 진행):', error);
        }

        // 테이블 생성
        const createProductsTable = `
          CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            barcode TEXT UNIQUE NOT NULL,
            product_name TEXT NOT NULL,
            keyword TEXT,
            company TEXT,
            country TEXT,
            category TEXT,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `;

        db.exec(createProductsTable);

        // 바코드에 인덱스 생성 (검색 성능 향상)
        const createBarcodeIndex = `
          CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)
        `;

        db.exec(createBarcodeIndex);

        // 키워드에 인덱스 생성
        const createKeywordIndex = `
          CREATE INDEX IF NOT EXISTS idx_products_keyword ON products(keyword)
        `;

        db.exec(createKeywordIndex);
      }

      console.warn('✅ SQLite 데이터베이스 초기화 완료');
      return { success: true };
    } catch (error) {
      console.error('❌ SQLite 데이터베이스 초기화 오류:', error);
      return { success: false, error };
    }
  }
}

// 상품 등록
export async function insertProduct(productData: ProductData) {
  // 모듈 초기화가 되지 않았다면 초기화
  if ((isProduction && !sql) || (!isProduction && !Database)) {
    await initializeDatabaseModules();
  }

  if (isProduction) {
    // PostgreSQL 구현
    try {
      if (!sql) {
        throw new Error('PostgreSQL module not initialized');
      }
      const result = await sql`
        INSERT INTO products (
          barcode, 
          product_name, 
          keyword, 
          company, 
          country, 
          category, 
          description
        )
        VALUES (
          ${productData.barcode},
          ${productData.productName},
          ${productData.keyword || productData.productName},
          ${productData.company || null},
          ${productData.country || null},
          ${productData.category || null},
          ${productData.description || null}
        )
        RETURNING id
      `;

      return {
        success: true,
        id: result.rows[0].id,
        message: '상품이 성공적으로 등록되었습니다.',
      };
    } catch (error: unknown) {
      // 중복 바코드 오류 처리
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === '23505'
      ) {
        return {
          success: false,
          error: '이미 등록된 바코드입니다.',
        };
      }

      console.error('상품 등록 오류:', error);
      return {
        success: false,
        error: '상품 등록 중 오류가 발생했습니다.',
      };
    }
  } else {
    // SQLite 구현 (재시도 로직 포함)
    const maxRetries = 3;
    const retryDelay = 100; // 100ms

    if (!Database) {
      throw new Error('SQLite module not initialized');
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const database = db || (await initializeDatabase(), db);
        if (!database) {
          throw new Error('Database not initialized');
        }

        const stmt = database.prepare(`
          INSERT INTO products (barcode, product_name, keyword, company, country, category, description)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
          productData.barcode,
          productData.productName,
          productData.keyword || productData.productName,
          productData.company || null,
          productData.country || null,
          productData.category || null,
          productData.description || null
        );

        return {
          success: true,
          id: result.lastInsertRowid,
          message: '상품이 성공적으로 등록되었습니다.',
        };
      } catch (error: unknown) {
        if (
          error &&
          typeof error === 'object' &&
          'code' in error &&
          error.code === 'SQLITE_CONSTRAINT_UNIQUE'
        ) {
          return {
            success: false,
            error: '이미 등록된 바코드입니다.',
          };
        }

        // SQLITE_BUSY 오류인 경우 재시도
        if (
          error &&
          typeof error === 'object' &&
          'code' in error &&
          error.code === 'SQLITE_BUSY'
        ) {
          console.warn(
            `데이터베이스 잠김, 재시도 중... (${attempt}/${maxRetries})`
          );

          if (attempt < maxRetries) {
            // 지수 백오프 방식으로 대기 시간 증가
            const delay = retryDelay * Math.pow(2, attempt - 1);
            // 동기식 대기 (블로킹)
            const start = Date.now();
            while (Date.now() - start < delay) {
              // 대기
            }
            continue;
          }
        }

        console.error('상품 등록 오류:', error);
        return {
          success: false,
          error: `상품 등록 중 오류가 발생했습니다. (시도 횟수: ${attempt}/${maxRetries})`,
        };
      }
    }

    return {
      success: false,
      error: '데이터베이스 연결에 실패했습니다. 잠시 후 다시 시도해주세요.',
    };
  }
}

// 바코드로 상품 조회
export async function getProductByBarcode(barcode: string) {
  // 모듈 초기화가 되지 않았다면 초기화
  if ((isProduction && !sql) || (!isProduction && !Database)) {
    await initializeDatabaseModules();
  }

  if (isProduction) {
    // PostgreSQL 구현
    try {
      if (!sql) {
        throw new Error('PostgreSQL module not initialized');
      }
      const result = await sql`
        SELECT * FROM products WHERE barcode = ${barcode}
      `;

      if (result.rows.length > 0) {
        const product = result.rows[0];
        return {
          success: true,
          product: {
            id: product.id,
            barcode: product.barcode,
            productName: product.product_name,
            keyword: product.keyword,
            company: product.company,
            country: product.country,
            category: product.category,
            description: product.description,
            createdAt: product.created_at,
            updatedAt: product.updated_at,
          },
        };
      } else {
        return {
          success: false,
          error: '해당 바코드의 상품을 찾을 수 없습니다.',
        };
      }
    } catch (error) {
      console.error('상품 조회 오류:', error);
      return {
        success: false,
        error: '상품 조회 중 오류가 발생했습니다.',
      };
    }
  } else {
    // SQLite 구현
    try {
      const database = db || (await initializeDatabase(), db);
      if (!database) {
        throw new Error('Database not initialized');
      }

      const stmt = database.prepare(`
        SELECT * FROM products WHERE barcode = ?
      `);

      const product = stmt.get(barcode) as Record<string, unknown> | undefined;

      if (product) {
        return {
          success: true,
          product: {
            id: product.id,
            barcode: product.barcode,
            productName: product.product_name,
            keyword: product.keyword,
            company: product.company,
            country: product.country,
            category: product.category,
            description: product.description,
            createdAt: product.created_at,
            updatedAt: product.updated_at,
          },
        };
      } else {
        return {
          success: false,
          error: '해당 바코드의 상품을 찾을 수 없습니다.',
        };
      }
    } catch (error) {
      console.error('상품 조회 오류:', error);
      return {
        success: false,
        error: '상품 조회 중 오류가 발생했습니다.',
      };
    }
  }
}

// 모든 상품 조회 (페이징 지원)
export async function getAllProducts(limit = 50, offset = 0) {
  // 모듈 초기화가 되지 않았다면 초기화
  if ((isProduction && !sql) || (!isProduction && !Database)) {
    await initializeDatabaseModules();
  }

  if (isProduction) {
    // PostgreSQL 구현
    try {
      if (!sql) {
        throw new Error('PostgreSQL module not initialized');
      }
      const result = await sql`
        SELECT * FROM products 
        ORDER BY created_at DESC 
        LIMIT ${limit} OFFSET ${offset}
      `;

      const countResult = await sql`
        SELECT COUNT(*) as total FROM products
      `;

      const products = result.rows.map((product: Record<string, unknown>) => ({
        id: product.id,
        barcode: product.barcode,
        productName: product.product_name,
        keyword: product.keyword,
        company: product.company,
        country: product.country,
        category: product.category,
        description: product.description,
        createdAt: product.created_at,
        updatedAt: product.updated_at,
      }));

      const total = parseInt(String(countResult.rows[0].total));

      return {
        success: true,
        products,
        total,
        hasMore: offset + limit < total,
      };
    } catch (error) {
      console.error('상품 목록 조회 오류:', error);
      return {
        success: false,
        error: '상품 목록 조회 중 오류가 발생했습니다.',
      };
    }
  } else {
    // SQLite 구현
    try {
      const database = db || (await initializeDatabase(), db);
      if (!database) {
        throw new Error('Database not initialized');
      }

      const stmt = database.prepare(`
        SELECT * FROM products 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `);

      const countStmt = database.prepare(`
        SELECT COUNT(*) as total FROM products
      `);

      const products = stmt.all(limit, offset);
      const totalResult = countStmt.get() as { total: number };

      return {
        success: true,
        products: products.map((product: unknown) => {
          const p = product as Record<string, unknown>;
          return {
            id: p.id,
            barcode: p.barcode,
            productName: p.product_name,
            keyword: p.keyword,
            company: p.company,
            country: p.country,
            category: p.category,
            description: p.description,
            createdAt: p.created_at,
            updatedAt: p.updated_at,
          };
        }),
        total: totalResult.total,
        hasMore: offset + limit < totalResult.total,
      };
    } catch (error) {
      console.error('상품 목록 조회 오류:', error);
      return {
        success: false,
        error: '상품 목록 조회 중 오류가 발생했습니다.',
      };
    }
  }
}

// 상품 정보 업데이트
export async function updateProduct(
  id: number,
  productData: Partial<ProductData>
) {
  // 모듈 초기화가 되지 않았다면 초기화
  if ((isProduction && !sql) || (!isProduction && !Database)) {
    await initializeDatabaseModules();
  }

  if (isProduction) {
    // PostgreSQL 구현
    try {
      if (!sql) {
        throw new Error('PostgreSQL module not initialized');
      }
      const fields = [];
      const values = [];

      if (productData.productName) {
        fields.push('product_name');
        values.push(productData.productName);
      }
      if (productData.keyword !== undefined) {
        fields.push('keyword');
        values.push(productData.keyword);
      }
      if (productData.company !== undefined) {
        fields.push('company');
        values.push(productData.company);
      }
      if (productData.country !== undefined) {
        fields.push('country');
        values.push(productData.country);
      }
      if (productData.category !== undefined) {
        fields.push('category');
        values.push(productData.category);
      }
      if (productData.description !== undefined) {
        fields.push('description');
        values.push(productData.description);
      }

      if (fields.length === 0) {
        return {
          success: false,
          error: '업데이트할 데이터가 없습니다.',
        };
      }

      // 동적으로 SET 절 구성
      const setClause = fields
        .map((field, index) => `${field} = $${index + 1}`)
        .join(', ');

      const result = await sql.query(
        `UPDATE products SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $${fields.length + 1}`,
        [...values, id]
      );

      if (result.rowCount && result.rowCount > 0) {
        return {
          success: true,
          message: '상품 정보가 성공적으로 업데이트되었습니다.',
        };
      } else {
        return {
          success: false,
          error: '해당 상품을 찾을 수 없습니다.',
        };
      }
    } catch (error) {
      console.error('상품 업데이트 오류:', error);
      return {
        success: false,
        error: '상품 업데이트 중 오류가 발생했습니다.',
      };
    }
  } else {
    // SQLite 구현
    try {
      if (!Database) {
        throw new Error('SQLite module not initialized');
      }
      const database = db || (await initializeDatabase(), db);
      if (!database) {
        throw new Error('Database not initialized');
      }

      const fields = [];
      const values = [];

      if (productData.productName) {
        fields.push('product_name = ?');
        values.push(productData.productName);
      }
      if (productData.keyword !== undefined) {
        fields.push('keyword = ?');
        values.push(productData.keyword);
      }
      if (productData.company !== undefined) {
        fields.push('company = ?');
        values.push(productData.company);
      }
      if (productData.country !== undefined) {
        fields.push('country = ?');
        values.push(productData.country);
      }
      if (productData.category !== undefined) {
        fields.push('category = ?');
        values.push(productData.category);
      }
      if (productData.description !== undefined) {
        fields.push('description = ?');
        values.push(productData.description);
      }

      if (fields.length === 0) {
        return {
          success: false,
          error: '업데이트할 데이터가 없습니다.',
        };
      }

      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      const stmt = database.prepare(`
        UPDATE products SET ${fields.join(', ')} WHERE id = ?
      `);

      const result = stmt.run(...values);

      if (result.changes && result.changes > 0) {
        return {
          success: true,
          message: '상품 정보가 성공적으로 업데이트되었습니다.',
        };
      } else {
        return {
          success: false,
          error: '해당 상품을 찾을 수 없습니다.',
        };
      }
    } catch (error) {
      console.error('상품 업데이트 오류:', error);
      return {
        success: false,
        error: '상품 업데이트 중 오류가 발생했습니다.',
      };
    }
  }
}

// 상품 삭제
export async function deleteProduct(id: number) {
  // 모듈 초기화가 되지 않았다면 초기화
  if ((isProduction && !sql) || (!isProduction && !Database)) {
    await initializeDatabaseModules();
  }

  if (isProduction) {
    // PostgreSQL 구현
    try {
      if (!sql) {
        throw new Error('PostgreSQL module not initialized');
      }
      const result = await sql`
        DELETE FROM products WHERE id = ${id}
      `;

      if (result.rowCount && result.rowCount > 0) {
        return {
          success: true,
          message: '상품이 성공적으로 삭제되었습니다.',
        };
      } else {
        return {
          success: false,
          error: '해당 상품을 찾을 수 없습니다.',
        };
      }
    } catch (error) {
      console.error('상품 삭제 오류:', error);
      return {
        success: false,
        error: '상품 삭제 중 오류가 발생했습니다.',
      };
    }
  } else {
    // SQLite 구현
    try {
      if (!Database) {
        throw new Error('SQLite module not initialized');
      }
      const database = db || (await initializeDatabase(), db);
      if (!database) {
        throw new Error('Database not initialized');
      }

      const stmt = database.prepare(`
        DELETE FROM products WHERE id = ?
      `);

      const result = stmt.run(id);

      if (result.changes && result.changes > 0) {
        return {
          success: true,
          message: '상품이 성공적으로 삭제되었습니다.',
        };
      } else {
        return {
          success: false,
          error: '해당 상품을 찾을 수 없습니다.',
        };
      }
    } catch (error) {
      console.error('상품 삭제 오류:', error);
      return {
        success: false,
        error: '상품 삭제 중 오류가 발생했습니다.',
      };
    }
  }
}

// 데이터베이스 상태 확인
export async function checkDatabaseHealth() {
  // 모듈 초기화가 되지 않았다면 초기화
  if ((isProduction && !sql) || (!isProduction && !Database)) {
    await initializeDatabaseModules();
  }

  if (isProduction) {
    // PostgreSQL 상태 확인
    try {
      if (!sql) {
        throw new Error('PostgreSQL module not initialized');
      }
      await sql`SELECT 1 as health_check`;
      return {
        success: true,
        message: 'PostgreSQL 연결 정상',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('PostgreSQL 상태 확인 오류:', error);
      return {
        success: false,
        error: 'PostgreSQL 연결 실패',
        timestamp: new Date().toISOString(),
      };
    }
  } else {
    // SQLite 상태 확인
    try {
      if (!Database) {
        throw new Error('SQLite module not initialized');
      }
      const database = db || (await initializeDatabase(), db);
      if (!database) {
        throw new Error('Database not initialized');
      }
      const stmt = database.prepare('SELECT 1 as health_check');
      stmt.get();
      return {
        success: true,
        message: 'SQLite 연결 정상',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('SQLite 상태 확인 오류:', error);
      return {
        success: false,
        error: 'SQLite 연결 실패',
        timestamp: new Date().toISOString(),
      };
    }
  }
}
