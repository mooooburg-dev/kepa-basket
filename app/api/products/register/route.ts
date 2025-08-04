import { NextRequest, NextResponse } from 'next/server';

// 임시 상품 데이터 저장소 (실제 운영에서는 데이터베이스 사용)
let registeredProducts: Array<{
  id: string;
  barcode: string;
  productName: string;
  company: string;
  country: string;
  category: string;
  description?: string;
  registeredAt: string;
  updatedAt: string;
}> = [];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { barcode, productName, company, country, category, description } = body;

    // 필수 필드 검증
    if (!barcode || !productName || !company || !country || !category) {
      return NextResponse.json(
        { 
          error: '필수 필드가 누락되었습니다.',
          required: ['barcode', 'productName', 'company', 'country', 'category']
        },
        { status: 400 }
      );
    }

    // 바코드 형식 검증 (8-13자리 숫자)
    if (!/^\d{8,13}$/.test(barcode)) {
      return NextResponse.json(
        { error: '올바른 바코드 형식이 아닙니다. (8-13자리 숫자)' },
        { status: 400 }
      );
    }

    // 이미 등록된 바코드인지 확인
    const existingProduct = registeredProducts.find(p => p.barcode === barcode);
    if (existingProduct) {
      return NextResponse.json(
        { 
          error: '이미 등록된 바코드입니다.',
          existingProduct: {
            productName: existingProduct.productName,
            company: existingProduct.company,
            registeredAt: existingProduct.registeredAt
          }
        },
        { status: 409 }
      );
    }

    // 새 상품 등록
    const newProduct = {
      id: `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      barcode,
      productName: productName.trim(),
      company: company.trim(),
      country: country.trim(),
      category: category.trim(),
      description: description?.trim() || '',
      registeredAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    registeredProducts.push(newProduct);

    console.log(`✅ 새 상품 등록 완료: ${productName} (바코드: ${barcode})`);

    return NextResponse.json({
      success: true,
      message: '상품이 성공적으로 등록되었습니다.',
      product: newProduct,
      totalRegistered: registeredProducts.length
    });

  } catch (error) {
    console.error('상품 등록 API 오류:', error);
    
    return NextResponse.json(
      { 
        error: '상품 등록 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// 등록된 상품 목록 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const barcode = searchParams.get('barcode');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (barcode) {
      // 특정 바코드 조회
      const product = registeredProducts.find(p => p.barcode === barcode);
      if (product) {
        return NextResponse.json({
          success: true,
          product,
          found: true
        });
      } else {
        return NextResponse.json({
          success: false,
          found: false,
          message: '등록된 상품을 찾을 수 없습니다.'
        });
      }
    } else {
      // 전체 목록 조회 (페이징)
      const totalCount = registeredProducts.length;
      const products = registeredProducts
        .sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime())
        .slice(offset, offset + limit);

      return NextResponse.json({
        success: true,
        products,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        }
      });
    }
  } catch (error) {
    console.error('상품 조회 API 오류:', error);
    
    return NextResponse.json(
      { 
        error: '상품 조회 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}