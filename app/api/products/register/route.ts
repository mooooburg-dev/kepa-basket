import { NextRequest, NextResponse } from 'next/server';
import {
  insertProduct,
  getProductByBarcode,
  getAllProducts,
  ProductData,
} from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { barcode, productName, company, country, category, description } =
      body;

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
        { error: '올바른 바코드 형식이 아닙니다. (8-13자리 숫자)' },
        { status: 400 }
      );
    }

    // 이미 등록된 바코드인지 확인
    const existingResult = getProductByBarcode(barcode);
    if (existingResult.success) {
      return NextResponse.json(
        {
          error: '이미 등록된 바코드입니다.',
          existingProduct: {
            productName: existingResult.product?.productName,
            company: existingResult.product?.company,
            createdAt: existingResult.product?.createdAt,
          },
        },
        { status: 409 }
      );
    }

    // 새 상품 등록
    const productData: ProductData = {
      barcode,
      productName: productName.trim(),
      company: company.trim(),
      country: country.trim(),
      category: category.trim(),
      description: description?.trim() || '',
    };

    const result = insertProduct(productData);

    if (result.success) {
      console.warn(`✅ 새 상품 등록 완료: ${productName} (바코드: ${barcode})`);

      return NextResponse.json({
        success: true,
        message: result.message,
        product: {
          id: result.id,
          ...productData,
        },
      });
    } else {
      return NextResponse.json(
        {
          error: result.error,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('상품 등록 API 오류:', error);

    return NextResponse.json(
      {
        error: '상품 등록 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
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
      const result = getProductByBarcode(barcode);

      if (result.success) {
        return NextResponse.json({
          success: true,
          product: result.product,
          found: true,
        });
      } else {
        return NextResponse.json({
          success: false,
          found: false,
          message: '등록된 상품을 찾을 수 없습니다.',
        });
      }
    } else {
      // 전체 목록 조회 (페이징)
      const result = getAllProducts(limit, offset);

      if (result.success) {
        return NextResponse.json({
          success: true,
          products: result.products,
          pagination: {
            total: result.total,
            limit,
            offset,
            hasMore: result.hasMore,
          },
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
        error: '상품 조회 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
