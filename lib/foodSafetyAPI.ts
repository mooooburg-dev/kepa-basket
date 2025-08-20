import axios from 'axios';

// 식품의약품안전처 API 키
const API_KEY = 'f5f2c3dc00b14704909a';
const BASE_URL = 'http://openapi.foodsafetykorea.go.kr/api';

// C005 API 응답 (식품첨가물)
interface C005Response {
  C005?: {
    total_count: string;
    row: Array<{
      BAR_CD: string;
      PRDLST_NM: string;
      BSSH_NM: string;
      PRDLST_DCNM: string;
      [key: string]: string;
    }>;
    RESULT: {
      MSG: string;
      CODE: string;
    };
  };
}

// I2570 API 응답 (바코드 기반 상품 정보)
interface I2570Response {
  I2570?: {
    total_count: string;
    row: Array<{
      BRCD_NO: string;
      PRDT_NM: string;
      ENTRPS: string;
      PRDCTN_NTON_NM: string;
      PRDCTN_NM: string;
      PRDLST_MATR: string;
      [key: string]: string;
    }>;
    RESULT: {
      MSG: string;
      CODE: string;
    };
  };
}

// 표준화된 상품 정보
export interface StandardizedProductInfo {
  barcode: string;
  productName: string;
  company: string;
  country?: string;
  category?: string;
  description?: string;
  source: 'C005' | 'I2570';
  sourceLabel: string;
}

// 제조사명을 제품명에서 제거하는 함수
export function removeCompanyFromProductName(
  productName: string,
  company: string
): string {
  if (!company || !productName) return productName;

  // 회사명에서 (주), 주식회사, ㈜ 등 제거
  const cleanCompany = company
    .replace(/\(주\)|주식회사|㈜|\(|\)|주\)|株式会社|Co\.|Ltd\.|Inc\./g, '')
    .trim();

  if (!cleanCompany) return productName;

  // 제품명에서 회사명 제거 (앞쪽에 있는 경우)
  const withoutCompanyAtStart = productName
    .replace(new RegExp(`^${cleanCompany}\\s*`, 'i'), '')
    .trim();

  // 제품명에서 회사명 제거 (뒤쪽에 있는 경우)
  const withoutCompanyAtEnd = withoutCompanyAtStart
    .replace(new RegExp(`\\s*${cleanCompany}$`, 'i'), '')
    .trim();

  // 제거 후 빈 문자열이면 원래 제품명 반환
  return withoutCompanyAtEnd || productName;
}

// C005 API 호출 (식품첨가물)
export async function searchC005API(barcode: string): Promise<{
  success: boolean;
  product?: StandardizedProductInfo;
  error?: string;
}> {
  try {
    console.warn(`C005 API 호출 시작: 바코드 ${barcode}`);

    const response = await axios.get<C005Response>(
      `${BASE_URL}/${API_KEY}/C005/json/1/100/BAR_CD=${barcode}`,
      {
        timeout: 10000, // 10초 타임아웃
      }
    );

    const data = response.data.C005;

    if (!data || data.RESULT.CODE !== 'INFO-000') {
      console.warn(`C005 API 오류: ${data?.RESULT.MSG || 'Unknown error'}`);
      return {
        success: false,
        error: data?.RESULT.MSG || 'API 호출 실패',
      };
    }

    if (!data.row || data.row.length === 0) {
      console.warn('C005 API: 데이터 없음');
      return {
        success: false,
        error: '데이터 없음',
      };
    }

    const item = data.row[0];

    const product: StandardizedProductInfo = {
      barcode: item.BAR_CD,
      productName: item.PRDLST_NM,
      company: item.BSSH_NM,
      category: item.PRDLST_DCNM,
      source: 'C005',
      sourceLabel: '식품첨가물 정보',
    };

    console.warn(`C005 API 성공: ${product.productName}`);

    return {
      success: true,
      product,
    };
  } catch (error) {
    console.error('C005 API 호출 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'API 호출 실패',
    };
  }
}

// I2570 API 호출 (바코드 기반 상품 정보)
export async function searchI2570API(barcode: string): Promise<{
  success: boolean;
  product?: StandardizedProductInfo;
  error?: string;
}> {
  try {
    console.warn(`I2570 API 호출 시작: 바코드 ${barcode}`);

    const response = await axios.get<I2570Response>(
      `${BASE_URL}/${API_KEY}/I2570/json/1/100/BRCD_NO=${barcode}`,
      {
        timeout: 10000, // 10초 타임아웃
      }
    );

    const data = response.data.I2570;

    if (!data || data.RESULT.CODE !== 'INFO-000') {
      console.warn(`I2570 API 오류: ${data?.RESULT.MSG || 'Unknown error'}`);
      return {
        success: false,
        error: data?.RESULT.MSG || 'API 호출 실패',
      };
    }

    if (!data.row || data.row.length === 0) {
      console.warn('I2570 API: 데이터 없음');
      return {
        success: false,
        error: '데이터 없음',
      };
    }

    const item = data.row[0];

    const product: StandardizedProductInfo = {
      barcode: item.BRCD_NO,
      productName: item.PRDT_NM,
      company: item.ENTRPS,
      country: item.PRDCTN_NTON_NM,
      category: item.PRDCTN_NM,
      description: item.PRDLST_MATR,
      source: 'I2570',
      sourceLabel: '바코드 상품 정보',
    };

    console.warn(`I2570 API 성공: ${product.productName}`);

    return {
      success: true,
      product,
    };
  } catch (error) {
    console.error('I2570 API 호출 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'API 호출 실패',
    };
  }
}
