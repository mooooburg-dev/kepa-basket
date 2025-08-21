import { NextRequest, NextResponse } from 'next/server';
import {
  insertProduct,
  getProductByBarcode,
  getAllProducts,
  initializeDatabase,
  ProductData,
} from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    // 데이터베이스 초기화 (필요시)
    await initializeDatabase();

    const body = await request.json();
    const {
      barcode,
      productName,
      keyword,
      company,
      country,
      category,
      description,
    } = body;

    // 필수 필드 검증
    if (!barcode || !productName || !company || !country || !category) {
      return NextResponse.json(
        {
          error: '필수 필드가 누락되었습니다.',
          required: [
            'barcode',
            'productName',
            'company',
            'country',
            'category',
          ],
        },
        { status: 400 }
      );
    }

    // 바코드 형식 검증 (8-13자리 숫자)
    if (!/^\d{8,13}$/.test(barcode)) {
      return NextResponse.json(
        {
          error: '올바른 바코드 형식이 아닙니다. (8-13자리 숫자)',
          barcode,
        },
        { status: 400 }
      );
    }

    // 중복 바코드 확인
    const existingProduct = await getProductByBarcode(barcode);
    if (existingProduct.success) {
      return NextResponse.json(
        {
          error: '이미 등록된 바코드입니다.',
          barcode,
          existingProduct: existingProduct.product,
        },
        { status: 409 }
      );
    }

    // 상품 등록
    const productData: ProductData = {
      barcode,
      productName,
      keyword: keyword || productName,
      company,
      country,
      category,
      description: description || null,
    };

    const result = await insertProduct(productData);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        productId: result.id,
        product: productData,
      });
    } else {
      return NextResponse.json(
        {
          error: result.error,
          barcode,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('상품 등록 API 오류:', error);
    return NextResponse.json(
      {
        error: '상품 등록 중 내부 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // 데이터베이스 초기화 (필요시)
    await initializeDatabase();

    const searchParams = request.nextUrl.searchParams;
    const barcode = searchParams.get('barcode');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (barcode) {
      // 특정 바코드 조회
      const result = await getProductByBarcode(barcode);

      if (result.success) {
        return NextResponse.json({
          success: true,
          product: result.product,
        });
      } else {
        return NextResponse.json(
          {
            error: result.error,
            barcode,
          },
          { status: 404 }
        );
      }
    } else {
      // 전체 목록 조회 (페이징)
      const result = await getAllProducts(limit, offset);

      if (result.success) {
        return NextResponse.json({
          success: true,
          products: result.products,
          total: result.total,
          limit,
          offset,
          hasMore: result.hasMore,
        });
      } else {
        return NextResponse.json(
          {
            error: result.error,
          },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error('상품 조회 API 오류:', error);
    return NextResponse.json(
      {
        error: '상품 조회 중 내부 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
