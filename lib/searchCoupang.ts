import axios from 'axios';
import { Product, SearchResult } from '@/types';
import { API_CONFIG } from '@/utils/constants';

const COUPANG_API_KEY = process.env.COUPANG_API_KEY;

export async function searchCoupangProducts(
  keyword: string
): Promise<SearchResult> {
  if (!COUPANG_API_KEY) {
    throw new Error('쿠팡 API 키가 설정되지 않았습니다.');
  }

  try {
    const response = await axios.get(
      `${API_CONFIG.COUPANG.BASE_URL}/products/search`,
      {
        headers: {
          Authorization: `Bearer ${COUPANG_API_KEY}`,
          'Content-Type': 'application/json',
        },
        params: {
          keyword,
          limit: API_CONFIG.COUPANG.SEARCH_LIMIT,
        },
      }
    );

    const products: Product[] =
      response.data.data?.productData?.map((item: Record<string, unknown>) => ({
        id: item.productId,
        name: item.productName,
        price: item.productPrice,
        imageUrl: item.productImage,
        link: item.productUrl,
        storeName: 'coupang',
      })) || [];

    return {
      keyword,
      products,
      totalCount: response.data.data?.totalCount || 0,
    };
  } catch (error) {
    console.error('쿠팡 검색 에러:', error);
    return {
      keyword,
      products: [],
      totalCount: 0,
    };
  }
}
