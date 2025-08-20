import axios from 'axios';
import crypto from 'crypto';
import { Product, SearchResult } from '@/types';
import { API_CONFIG } from '@/utils/constants';
import { calculateSimilarityScore } from './getSimilarity';

const ACCESS_KEY =
  process.env.COUPANG_ACCESS_KEY || 'adb8681c-41ba-477b-9840-19daec90333c';
const SECRET_KEY =
  process.env.COUPANG_SECRET_KEY || '344ab4dead272126a075b5a8b002ca08b85348fa';

// 유사도 임계값 설정
const SIMILARITY_THRESHOLD = 0.3;
const MIN_RESULTS = 3; // 최소 결과 개수

// 메인 제품명 추출 함수
export function extractMainProductKeyword(keyword: string): string {
  const trimmed = keyword.trim();

  // 공백이 없으면 그대로 반환
  if (!trimmed.includes(' ')) {
    return trimmed;
  }

  // 알려진 제품 패턴들 (브랜드 + 제품명)
  const knownPatterns = [
    // 음료수
    { pattern: /코카콜라\s+제로/i, replacement: '코카콜라제로' },
    { pattern: /코카콜라\s+라이트/i, replacement: '코카콜라라이트' },
    { pattern: /펩시\s+제로/i, replacement: '펩시제로' },
    { pattern: /환타\s+오렌지/i, replacement: '환타오렌지' },
    { pattern: /스프라이트\s+제로/i, replacement: '스프라이트제로' },

    // 라면/면류
    { pattern: /신라면\s+블랙/i, replacement: '신라면블랙' },
    { pattern: /진라면\s+매운맛/i, replacement: '진라면매운맛' },
    { pattern: /진라면\s+순한맛/i, replacement: '진라면순한맛' },
    { pattern: /불닭볶음면\s+치즈/i, replacement: '불닭볶음면치즈' },
    { pattern: /짜파게티\s+왕/i, replacement: '짜파게티왕' },

    // 과자/스낵
    { pattern: /새우깡\s+매운맛/i, replacement: '새우깡매운맛' },
    { pattern: /프링글스\s+오리지널/i, replacement: '프링글스오리지널' },
    { pattern: /허니버터칩\s+아몬드/i, replacement: '허니버터칩아몬드' },
  ];

  // 알려진 패턴과 매칭되는지 확인
  for (const { pattern, replacement } of knownPatterns) {
    if (pattern.test(trimmed)) {
      return replacement;
    }
  }

  // 메인 브랜드/제품명 추출 로직
  const words = trimmed.split(/\s+/);

  // 한국 제품 브랜드명들 (메인 키워드로 인식할 단어들)
  const mainBrands = [
    '오리온',
    '농심',
    '롯데',
    '해태',
    '팔도',
    '크라운',
    '삼성',
    'LG',
    '애플',
    '갤럭시',
    '아이폰',
    '나이키',
    '아디다스',
    '푸마',
    '컨버스',
  ];

  // 메인 브랜드가 포함된 단어가 있는지 확인
  for (const word of words) {
    for (const brand of mainBrands) {
      if (word.includes(brand) || brand.includes(word)) {
        // 브랜드가 포함된 단어가 있으면 전체를 연결
        return words.join('');
      }
    }
  }

  // 브랜드명이 없으면 첫 번째 단어를 메인으로 간주
  // 하지만 조사나 수식어가 아닌 경우에만
  const particles = [
    '의',
    '를',
    '을',
    '가',
    '은',
    '는',
    '에',
    '로',
    '으로',
    '와',
    '과',
  ];
  const modifiers = ['새로운', '신상', '한정', '특가', '할인'];

  // 첫 번째 단어가 조사나 수식어가 아니면 첫 번째 단어 사용
  const firstWord = words[0];
  if (!particles.includes(firstWord) && !modifiers.includes(firstWord)) {
    // 2글자 이상이면 단독으로 사용, 아니면 다음 단어와 결합
    if (firstWord.length >= 2) {
      return firstWord;
    } else if (words.length > 1) {
      return firstWord + words[1];
    }
  }

  // 기본적으로 모든 단어를 공백 없이 연결
  return words.join('');
}

function generateHmac(
  method: string,
  url: string,
  secretKey: string,
  accessKey: string
): string {
  const parts = url.split(/\?/);
  const path = parts[0];
  const query = parts[1] || '';

  // Format: YYMMDD[T]HHmmss[Z]
  const date = new Date();
  const datetime =
    date.getUTCFullYear().toString().slice(-2) +
    (date.getUTCMonth() + 1).toString().padStart(2, '0') +
    date.getUTCDate().toString().padStart(2, '0') +
    'T' +
    date.getUTCHours().toString().padStart(2, '0') +
    date.getUTCMinutes().toString().padStart(2, '0') +
    date.getUTCSeconds().toString().padStart(2, '0') +
    'Z';

  const message = datetime + method + path + query;
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(message)
    .digest('hex');

  return `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${datetime}, signature=${signature}`;
}

export async function searchCoupangProducts(
  keyword: string,
  similarityThreshold: number = SIMILARITY_THRESHOLD,
  skipExtraction: boolean = false
): Promise<SearchResult> {
  try {
    // 검색어 처리: skipExtraction이 true면 키워드 추출 건너뛰기 (로컬 DB 상품용)
    const searchKeyword = skipExtraction
      ? keyword
      : extractMainProductKeyword(keyword);

    console.warn(
      `검색어 처리: "${keyword}" → "${searchKeyword}" (추출 건너뛰기: ${skipExtraction})`
    );

    const method = 'GET';
    const path =
      '/v2/providers/affiliate_open_api/apis/openapi/v1/products/search';
    const queryString = `keyword=${encodeURIComponent(searchKeyword)}&limit=${API_CONFIG.COUPANG.SEARCH_LIMIT}`;
    const url = path + '?' + queryString;

    const authorization = generateHmac(method, url, SECRET_KEY, ACCESS_KEY);

    const response = await axios.get(
      `${API_CONFIG.COUPANG.BASE_URL}/products/search`,
      {
        headers: {
          Authorization: authorization,
          'Content-Type': 'application/json',
        },
        params: {
          keyword: searchKeyword,
          limit: API_CONFIG.COUPANG.SEARCH_LIMIT,
        },
      }
    );

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
    // 원래 검색어(keyword)와 실제 검색어(searchKeyword) 모두 고려
    const productsWithSimilarity = allProducts.map((product) => {
      const originalSimilarity = calculateSimilarityScore(
        keyword,
        product.name as string
      );
      const searchSimilarity =
        keyword !== searchKeyword
          ? calculateSimilarityScore(searchKeyword, product.name as string)
          : originalSimilarity;

      // 둘 중 더 높은 유사도 사용
      return {
        ...product,
        similarity: Math.max(originalSimilarity, searchSimilarity),
      };
    });

    // 유사도 순으로 정렬
    const sortedProducts = productsWithSimilarity.sort(
      (a, b) => b.similarity - a.similarity
    );

    // 유사도 임계값 이상인 제품 필터링
    let filteredProducts = sortedProducts.filter(
      (product) => product.similarity >= similarityThreshold
    );

    // 만약 결과가 너무 적으면 임계값을 낮춰서 최소 결과 확보
    if (
      filteredProducts.length < MIN_RESULTS &&
      sortedProducts.length >= MIN_RESULTS
    ) {
      filteredProducts = sortedProducts.slice(0, MIN_RESULTS);
      console.warn(`유사도 임계값 완화: 최소 ${MIN_RESULTS}개 결과 확보`);
    }

    // similarity 필드 제거하고 최종 결과 생성
    const finalProducts = filteredProducts.map(
      ({ similarity: _similarity, ...product }) => product
    );

    console.warn(
      `쿠팡 검색 결과 필터링: ${allProducts.length}개 → ${finalProducts.length}개`
    );
    console.warn(
      '상위 5개 유사도 점수:',
      sortedProducts.slice(0, 5).map((p) => ({
        name: p.name,
        similarity: p.similarity.toFixed(3),
      }))
    );

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
