import Database from 'better-sqlite3';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';

// 데이터베이스 파일 경로 설정
const dbPath = path.join(process.cwd(), 'data', 'products.db');

// 데이터베이스 인스턴스 생성
let db: Database.Database;

// 데이터베이스 초기화 함수
export function initializeDatabase() {
  if (!db) {
    // data 디렉토리가 없으면 생성
    const dataDir = path.dirname(dbPath);
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }

    db = new Database(dbPath);

    try {
      // WAL 모드 설정 (Write-Ahead Logging) - 동시성 향상
      db.pragma('journal_mode = WAL');

      // 바쁜 타임아웃 설정 (5초)
      db.pragma('busy_timeout = 5000');
    } catch (error) {
      console.warn('데이터베이스 최적화 설정 실패 (계속 진행):', error);
      // WAL 모드 설정 실패해도 계속 진행
    }

    // 테이블이 없으면 생성
    createTables();
  }
  return db;
}

// 테이블 생성 함수
function createTables() {
  // 상품 테이블 생성
  const createProductsTable = `
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barcode TEXT UNIQUE NOT NULL,
      product_name TEXT NOT NULL,
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
}

// 상품 등록
export interface ProductData {
  barcode: string;
  productName: string;
  keyword?: string;
  company?: string;
  country?: string;
  category?: string;
  description?: string;
}

export function insertProduct(productData: ProductData) {
  // 재시도 로직 구현
  const maxRetries = 3;
  const retryDelay = 100; // 100ms

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const database = initializeDatabase();

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

// 바코드로 상품 조회
export function getProductByBarcode(barcode: string) {
  const database = initializeDatabase();

  const stmt = database.prepare(`
    SELECT * FROM products WHERE barcode = ?
  `);

  try {
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

// 모든 상품 조회 (페이징 지원)
export function getAllProducts(limit = 50, offset = 0) {
  const database = initializeDatabase();

  const stmt = database.prepare(`
    SELECT * FROM products 
    ORDER BY created_at DESC 
    LIMIT ? OFFSET ?
  `);

  const countStmt = database.prepare(`
    SELECT COUNT(*) as total FROM products
  `);

  try {
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

// 상품 정보 업데이트
export function updateProduct(id: number, productData: Partial<ProductData>) {
  const database = initializeDatabase();

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

  try {
    const result = stmt.run(...values);

    if (result.changes > 0) {
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

// 상품 삭제
export function deleteProduct(id: number) {
  const database = initializeDatabase();

  const stmt = database.prepare(`
    DELETE FROM products WHERE id = ?
  `);

  try {
    const result = stmt.run(id);

    if (result.changes > 0) {
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

// 데이터베이스 연결 종료
export function closeDatabase() {
  if (db) {
    db.close();
  }
}
