import axios from 'axios';
import crypto from 'crypto';
import { Product, SearchResult } from '@/types';
import { API_CONFIG } from '@/utils/constants';

const ACCESS_KEY = process.env.COUPANG_ACCESS_KEY || 'adb8681c-41ba-477b-9840-19daec90333c';
const SECRET_KEY = process.env.COUPANG_SECRET_KEY || '344ab4dead272126a075b5a8b002ca08b85348fa';

function generateHmac(method: string, url: string, secretKey: string, accessKey: string): string {
  const parts = url.split(/\?/);
  const path = parts[0];
  const query = parts[1] || '';
  
  // Format: YYMMDD[T]HHmmss[Z]
  const date = new Date();
  const datetime = date.getUTCFullYear().toString().slice(-2) +
    (date.getUTCMonth() + 1).toString().padStart(2, '0') +
    date.getUTCDate().toString().padStart(2, '0') + 'T' +
    date.getUTCHours().toString().padStart(2, '0') +
    date.getUTCMinutes().toString().padStart(2, '0') +
    date.getUTCSeconds().toString().padStart(2, '0') + 'Z';
  
  const message = datetime + method + path + query;
  const signature = crypto.createHmac('sha256', secretKey)
    .update(message)
    .digest('hex');
  
  return `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${datetime}, signature=${signature}`;
}

export async function searchCoupangProducts(
  keyword: string
): Promise<SearchResult> {
  try {
    const method = 'GET';
    const path = '/v2/providers/affiliate_open_api/apis/openapi/v1/products/search';
    const queryString = `keyword=${encodeURIComponent(keyword)}&limit=${API_CONFIG.COUPANG.SEARCH_LIMIT}`;
    const url = path + '?' + queryString;
    
    const authorization = generateHmac(method, url, SECRET_KEY, ACCESS_KEY);
    
    const response = await axios.get(`${API_CONFIG.COUPANG.BASE_URL}/products/search`, {
      headers: {
        'Authorization': authorization,
        'Content-Type': 'application/json',
      },
      params: {
        keyword,
        limit: API_CONFIG.COUPANG.SEARCH_LIMIT,
      },
    });

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
