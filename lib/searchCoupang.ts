import axios from 'axios';
import crypto from 'crypto';
import { Product, SearchResult } from '@/types';
import { API_CONFIG } from '@/utils/constants';
import { calculateSimilarityScore } from './getSimilarity';

const ACCESS_KEY = process.env.COUPANG_ACCESS_KEY || 'adb8681c-41ba-477b-9840-19daec90333c';
const SECRET_KEY = process.env.COUPANG_SECRET_KEY || '344ab4dead272126a075b5a8b002ca08b85348fa';

// 유사도 임계값 설정
const SIMILARITY_THRESHOLD = 0.3;
const MIN_RESULTS = 3; // 최소 결과 개수

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
  keyword: string,
  similarityThreshold: number = SIMILARITY_THRESHOLD
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

    const allProducts: Product[] =
      response.data.data?.productData?.map((item: Record<string, unknown>) => ({
        id: item.productId,
        name: item.productName,
        price: item.productPrice,
        imageUrl: item.productImage,
        link: item.productUrl,
        storeName: 'coupang',
      })) || [];

    // 유사도 기반 필터링 적용
    const productsWithSimilarity = allProducts.map(product => ({
      ...product,
      similarity: calculateSimilarityScore(keyword, product.name as string)
    }));

    // 유사도 순으로 정렬
    const sortedProducts = productsWithSimilarity
      .sort((a, b) => b.similarity - a.similarity);

    // 유사도 임계값 이상인 제품 필터링
    let filteredProducts = sortedProducts
      .filter(product => product.similarity >= similarityThreshold);

    // 만약 결과가 너무 적으면 임계값을 낮춰서 최소 결과 확보
    if (filteredProducts.length < MIN_RESULTS && sortedProducts.length >= MIN_RESULTS) {
      filteredProducts = sortedProducts.slice(0, MIN_RESULTS);
      console.log(`유사도 임계값 완화: 최소 ${MIN_RESULTS}개 결과 확보`);
    }

    // similarity 필드 제거하고 최종 결과 생성
    const finalProducts = filteredProducts.map(({ similarity, ...product }) => product);

    console.log(`쿠팡 검색 결과 필터링: ${allProducts.length}개 → ${finalProducts.length}개`);
    console.log('상위 5개 유사도 점수:', sortedProducts.slice(0, 5).map(p => ({ 
      name: p.name, 
      similarity: p.similarity.toFixed(3) 
    })));

    return {
      keyword,
      products: finalProducts,
      totalCount: finalProducts.length,
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
