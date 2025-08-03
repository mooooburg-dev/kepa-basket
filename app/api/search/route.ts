import { NextRequest, NextResponse } from 'next/server';
import { searchCoupangProducts } from '@/lib/searchCoupang';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const keyword = searchParams.get('keyword');

    if (!keyword) {
      return NextResponse.json(
        { error: '검색어가 필요합니다.' },
        { status: 400 }
      );
    }

    if (keyword.length < 2) {
      return NextResponse.json(
        { error: '검색어는 2글자 이상 입력해주세요.' },
        { status: 400 }
      );
    }

    const result = await searchCoupangProducts(keyword);

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Search API error:', error);

    return NextResponse.json(
      {
        error: '검색 중 오류가 발생했습니다.',
        keyword: request.nextUrl.searchParams.get('keyword') || '',
        products: [],
        totalCount: 0,
      },
      { status: 500 }
    );
  }
}
