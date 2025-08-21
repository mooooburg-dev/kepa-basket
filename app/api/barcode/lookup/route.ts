import { NextRequest, NextResponse } from 'next/server';
import {
  getProductByBarcode,
  insertProduct,
  initializeDatabase,
  ProductData,
} from '@/lib/database';
import {
  searchC005API,
  searchI2570API,
  removeCompanyFromProductName,
} from '@/lib/foodSafetyAPI';

/**
 * 바코드 조회 API - 3단계 폴백 시스템
 *
 * 1. 먼저 등록된 상품 DB에서 바코드를 조회
 * 2. 없으면 식품의약품안전처 C005 API 조회 (식품첨가물)
 * 3. 없으면 식품의약품안전처 I2570 API 조회 (바코드 상품 정보)
 * 4. 모두 실패하면 등록 필요 상태 반환 (barcode_not_found)
 * 5. 오류 발생 시 오류 상태 반환 (barcode_error)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const barcode = searchParams.get('barcode');

    if (!barcode) {
      return NextResponse.json(
        {
          type: 'barcode_error',
          error: '바코드가 제공되지 않았습니다.',
          data: { barcode: '' },
        },
        { status: 400 }
      );
    }

    // 바코드 형식 검증 (8-13자리 숫자)
    if (!/^\d{8,13}$/.test(barcode)) {
      return NextResponse.json(
        {
          type: 'barcode_error',
          error: '올바른 바코드 형식이 아닙니다. (8-13자리 숫자)',
          data: { barcode },
        },
        { status: 400 }
      );
    }

    // 데이터베이스 초기화 (필요시)
    await initializeDatabase();

    // 단계 1: 등록된 상품 DB에서 바코드 조회
    console.warn(`단계 1: PostgreSQL DB 조회 - 바코드 ${barcode}`);
    const localResult = await getProductByBarcode(barcode);

    if (localResult.success && localResult.product) {
      // 로컬 DB에서 발견된 경우
      console.warn(`✅ 로컬 DB에서 발견: ${localResult.product.productName}`);
      return NextResponse.json({
        type: 'barcode_success',
        message: '등록된 상품을 찾았습니다.',
        data: {
          barcode,
          productInfo: {
            id: localResult.product.id,
            productName: localResult.product.productName,
            keyword: localResult.product.keyword,
            company: localResult.product.company,
            country: localResult.product.country,
            category: localResult.product.category,
            description: localResult.product.description,
            source: 'PostgreSQL',
            sourceLabel: '등록된 상품',
            createdAt: localResult.product.createdAt,
            updatedAt: localResult.product.updatedAt,
          },
        },
      });
    }

    // 단계 2: 식품의약품안전처 C005 API 조회
    console.warn(`단계 2: C005 API 조회 - 바코드 ${barcode}`);
    const c005Result = await searchC005API(barcode);

    if (c005Result.success && c005Result.product) {
      console.warn(`✅ C005 API에서 발견: ${c005Result.product.productName}`);

      // C005에서 찾은 상품을 로컬 DB에 자동 저장
      // 쿠팡 검색을 위해 제조사명을 제거한 키워드 생성
      const cleanKeyword = removeCompanyFromProductName(
        c005Result.product.productName,
        c005Result.product.company
      );

      const productData: ProductData = {
        barcode: c005Result.product.barcode,
        productName: c005Result.product.productName,
        keyword: cleanKeyword,
        company: c005Result.product.company,
        country: c005Result.product.country,
        category: c005Result.product.category,
        description: c005Result.product.description,
      };

      try {
        const saveResult = await insertProduct(productData);
        if (saveResult.success) {
          console.warn(
            `✅ C005 상품 로컬 DB 자동 저장: ${productData.productName}`
          );
        }
      } catch (error) {
        console.warn('C005 상품 로컬 저장 실패:', error);
      }

      return NextResponse.json({
        type: 'barcode_success',
        message: '식품첨가물 정보에서 상품을 찾았습니다.',
        data: {
          barcode,
          productInfo: {
            productName: c005Result.product.productName,
            keyword: cleanKeyword, // 제조사명 제거된 키워드 (extractMainProductKeyword 미적용)
            company: c005Result.product.company,
            country: c005Result.product.country,
            category: c005Result.product.category,
            description: c005Result.product.description,
            source: c005Result.product.source,
            sourceLabel: c005Result.product.sourceLabel,
          },
        },
      });
    }

    // 단계 3: 식품의약품안전처 I2570 API 조회
    console.warn(`단계 3: I2570 API 조회 - 바코드 ${barcode}`);
    const i2570Result = await searchI2570API(barcode);

    if (i2570Result.success && i2570Result.product) {
      console.warn(`✅ I2570 API에서 발견: ${i2570Result.product.productName}`);

      // I2570에서 찾은 상품을 로컬 DB에 자동 저장
      // 쿠팡 검색을 위해 제조사명을 제거한 키워드 생성
      const cleanKeyword = removeCompanyFromProductName(
        i2570Result.product.productName,
        i2570Result.product.company
      );

      const productData: ProductData = {
        barcode: i2570Result.product.barcode,
        productName: i2570Result.product.productName,
        keyword: cleanKeyword,
        company: i2570Result.product.company,
        country: i2570Result.product.country,
        category: i2570Result.product.category,
        description: i2570Result.product.description,
      };

      try {
        const saveResult = await insertProduct(productData);
        if (saveResult.success) {
          console.warn(
            `✅ I2570 상품 로컬 DB 자동 저장: ${productData.productName}`
          );
        }
      } catch (error) {
        console.warn('I2570 상품 로컬 저장 실패:', error);
      }

      return NextResponse.json({
        type: 'barcode_success',
        message: '바코드 상품 정보에서 상품을 찾았습니다.',
        data: {
          barcode,
          productInfo: {
            productName: i2570Result.product.productName,
            keyword: cleanKeyword, // 제조사명 제거된 키워드 (extractMainProductKeyword 미적용)
            company: i2570Result.product.company,
            country: i2570Result.product.country,
            category: i2570Result.product.category,
            description: i2570Result.product.description,
            source: i2570Result.product.source,
            sourceLabel: i2570Result.product.sourceLabel,
          },
        },
      });
    }

    // 모든 API에서 찾지 못한 경우
    console.warn(`❌ 모든 소스에서 바코드 ${barcode}를 찾지 못함`);
    return NextResponse.json({
      type: 'barcode_not_found',
      message: '상품 정보를 찾을 수 없습니다. 수동 등록이 필요합니다.',
      data: {
        barcode,
      },
    });
  } catch (error) {
    console.error('바코드 조회 API 오류:', error);

    return NextResponse.json(
      {
        type: 'barcode_error',
        error: '바코드 조회 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
        data: {
          barcode: request.nextUrl.searchParams.get('barcode') || '',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST 메서드로 바코드 조회 (Body에 바코드 포함)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { barcode } = body;

    if (!barcode) {
      return NextResponse.json(
        {
          type: 'barcode_error',
          error: '바코드가 제공되지 않았습니다.',
          data: { barcode: '' },
        },
        { status: 400 }
      );
    }

    // 바코드 형식 검증 (8-13자리 숫자)
    if (!/^\d{8,13}$/.test(barcode)) {
      return NextResponse.json(
        {
          type: 'barcode_error',
          error: '올바른 바코드 형식이 아닙니다. (8-13자리 숫자)',
          data: { barcode },
        },
        { status: 400 }
      );
    }

    // GET 메서드와 동일한 로직 사용
    const searchParams = new URLSearchParams({ barcode });
    const mockRequest = {
      nextUrl: { searchParams },
    } as NextRequest;

    return GET(mockRequest);
  } catch (error) {
    console.error('바코드 조회 API 오류:', error);

    let barcode = '';
    try {
      const body = await request.json();
      barcode = body.barcode || '';
    } catch {
      // JSON 파싱 실패 시 빈 문자열로 설정
    }

    return NextResponse.json(
      {
        type: 'barcode_error',
        error: '바코드 조회 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
        data: { barcode },
      },
      { status: 500 }
    );
  }
}
