export const APP_CONFIG = {
  APP_NAME: '케파 장바구니',
  APP_DESCRIPTION: '바코드를 스캔하면 쿠팡 가격을 비교할 수 있어요.',
  CURRENCY: '₩',
  LOCALE: 'ko-KR',
};

export const API_CONFIG = {
  COUPANG: {
    BASE_URL:
      'https://api-gateway.coupang.com/v2/providers/affiliate_open_api/apis/openapi/v1',
    SEARCH_LIMIT: 10,
  },
};

export const UI_CONFIG = {
  SEARCH_DEBOUNCE_MS: 300,
  MAX_PRODUCT_NAME_LENGTH: 50,
};
