import React from 'react';

export interface BarcodeProductInfo {
  reportNo: string;
  productName: string;
  company: string;
  country: string;
  category: string;
  barcode: string;
  lastUpdated: string;
  source: 'I2570' | 'C005';
  sourceLabel: string;
  isUsingRealData: boolean;
}

export interface BarcodeDebugInfo {
  scanId: string;
  scanTime: string;
  barcode: string;
  barcodeLength: number;
  apiDuration?: number;
  usingSampleData: boolean;
  apiKey: string;
  timestamp: number;
  foundIn?: string;
  sourceLabel?: string;
  searchResult: 'found' | 'not_found' | 'error';
  searchedAPIs?: string[];
  errorCode?: string;
  errorDetails?: string;
  totalDuration?: number;
}

export interface BarcodeResultData {
  type: 'barcode_success' | 'barcode_not_found' | 'barcode_error';
  success: boolean;
  data: {
    barcode: string;
    productInfo?: BarcodeProductInfo;
    error?: string;
    debug: BarcodeDebugInfo;
  };
}

interface BarcodeResultProps {
  result: BarcodeResultData;
  onSearch?: (keyword: string) => void;
}

export function BarcodeResult({ result, onSearch }: BarcodeResultProps) {
  const { type, success, data } = result;

  const getStatusIcon = () => {
    switch (type) {
      case 'barcode_success':
        return '✅';
      case 'barcode_not_found':
        return '❌';
      case 'barcode_error':
        return '⚠️';
      default:
        return '📱';
    }
  };

  const getStatusTitle = () => {
    switch (type) {
      case 'barcode_success':
        return '바코드 스캔 성공';
      case 'barcode_not_found':
        return '제품 정보 없음';
      case 'barcode_error':
        return '스캔 오류 발생';
      default:
        return '바코드 스캔 결과';
    }
  };

  const getStatusColor = () => {
    switch (type) {
      case 'barcode_success':
        return 'from-green-50 to-green-100 border-green-200';
      case 'barcode_not_found':
        return 'from-yellow-50 to-yellow-100 border-yellow-200';
      case 'barcode_error':
        return 'from-red-50 to-red-100 border-red-200';
      default:
        return 'from-gray-50 to-gray-100 border-gray-200';
    }
  };

  return (
    <div
      className={`bg-gradient-to-r ${getStatusColor()} border-2 rounded-3xl p-6 mb-6`}
    >
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-6">
        <div className="text-3xl">{getStatusIcon()}</div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            {getStatusTitle()}
          </h3>
          <p className="text-sm text-gray-600">스캔 ID: {data.debug.scanId}</p>
        </div>
      </div>

      {/* 바코드 정보 */}
      <div className="bg-white/70 rounded-2xl p-4 mb-4">
        <h4 className="font-semibold text-gray-800 mb-2">바코드 정보</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">바코드:</span>
            <span className="font-mono font-bold text-gray-900">
              {data.barcode}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">길이:</span>
            <span className="text-gray-900">
              {data.debug.barcodeLength}자리
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">스캔 시간:</span>
            <span className="text-gray-900">
              {new Date(data.debug.scanTime).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* 제품 정보 (성공 시에만 표시) */}
      {success && data.productInfo && (
        <div className="bg-white/70 rounded-2xl p-4 mb-4">
          <h4 className="font-semibold text-gray-800 mb-2">제품 정보</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">제품명:</span>
              <span className="font-semibold text-gray-900 text-right max-w-[60%]">
                {data.productInfo.productName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">제조사:</span>
              <span className="text-gray-900">{data.productInfo.company}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">제조국가:</span>
              <span className="text-gray-900">{data.productInfo.country}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">분류:</span>
              <span className="text-gray-900">{data.productInfo.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">데이터 출처:</span>
              <span className="text-gray-900 text-xs bg-blue-100 px-2 py-1 rounded">
                {data.productInfo.sourceLabel}
              </span>
            </div>
          </div>

          {/* 자동 검색 안내 및 수동 검색 버튼 */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
              <span className="text-lg">✅</span>
              <span className="font-medium">
                자동으로 가격 비교 검색이 실행되었습니다!
              </span>
            </div>

            {onSearch && (
              <button
                onClick={() => onSearch(data.productInfo!.productName)}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-lg"
              >
                🔍 다시 검색하기
              </button>
            )}
          </div>
        </div>
      )}

      {/* 오류 정보 (오류 시에만 표시) */}
      {!success && data.error && (
        <div className="bg-white/70 rounded-2xl p-4 mb-4">
          <h4 className="font-semibold text-red-800 mb-2">오류 정보</h4>
          <p className="text-sm text-red-700">{data.error}</p>
          {data.debug.errorCode && (
            <p className="text-xs text-red-600 mt-2">
              오류 코드: {data.debug.errorCode}
            </p>
          )}
        </div>
      )}

      {/* API 정보 */}
      <div className="bg-white/70 rounded-2xl p-4">
        <h4 className="font-semibold text-gray-800 mb-2">API 정보</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">데이터 소스:</span>
            <span className="text-gray-900">
              {data.debug.usingSampleData ? '샘플 데이터' : '실제 데이터'}
            </span>
          </div>
          {data.debug.apiDuration && (
            <div className="flex justify-between">
              <span className="text-gray-600">API 응답 시간:</span>
              <span className="text-gray-900">{data.debug.apiDuration}ms</span>
            </div>
          )}
          {data.debug.searchedAPIs && (
            <div className="flex justify-between">
              <span className="text-gray-600">검색한 API:</span>
              <span className="text-gray-900">
                {data.debug.searchedAPIs.join(', ')}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">검색 결과:</span>
            <span
              className={`text-sm px-2 py-1 rounded ${
                data.debug.searchResult === 'found'
                  ? 'bg-green-100 text-green-800'
                  : data.debug.searchResult === 'not_found'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
              }`}
            >
              {data.debug.searchResult === 'found'
                ? '발견됨'
                : data.debug.searchResult === 'not_found'
                  ? '찾을 수 없음'
                  : '오류'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
