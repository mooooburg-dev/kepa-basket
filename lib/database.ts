import { sql } from '@vercel/postgres';

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

// 데이터베이스 초기화 함수
export async function initializeDatabase() {
  try {
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
    console.error('❌ 데이터베이스 초기화 오류:', error);
    return { success: false, error };
  }
}

// 상품 등록
export async function insertProduct(productData: ProductData) {
  try {
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
}

// 바코드로 상품 조회
export async function getProductByBarcode(barcode: string) {
  try {
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
}

// 모든 상품 조회 (페이징 지원)
export async function getAllProducts(limit = 50, offset = 0) {
  try {
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

    const total = parseInt(countResult.rows[0].total);

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
}

// 상품 정보 업데이트
export async function updateProduct(
  id: number,
  productData: Partial<ProductData>
) {
  try {
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
}

// 상품 삭제
export async function deleteProduct(id: number) {
  try {
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
}

// 데이터베이스 상태 확인
export async function checkDatabaseHealth() {
  try {
    await sql`SELECT 1 as health_check`;
    return {
      success: true,
      message: 'PostgreSQL 연결 정상',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('데이터베이스 상태 확인 오류:', error);
    return {
      success: false,
      error: '데이터베이스 연결 실패',
      timestamp: new Date().toISOString(),
    };
  }
}
