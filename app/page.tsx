'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Input } from '@/components/common';
import { ProductCard } from '@/components/product';
import { ProductRegistrationForm } from '@/components/product/ProductRegistrationForm';
import { useSearch } from '@/hooks';
import { APP_CONFIG } from '@/utils/constants';
import { Product } from '@/types';

// ReactNativeWebView 타입 선언
declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}

// 타입 정의
interface ConsoleLog {
  level: 'log' | 'warn' | 'error';
  message: string;
  timestamp: string;
  data?: unknown;
}

interface ProductRegistrationData {
  productName: string;
  barcode: string;
  keyword?: string;
  company?: string;
  country?: string;
  category?: string;
}

interface BarcodeMessageData {
  type: string;
  data?: {
    barcode?: string;
    scanId?: string;
    timestamp?: number;
    productInfo?: {
      productName: string;
      keyword?: string;
      source?: string;
      sourceLabel?: string;
    };
  };
  barcode?: string;
}

export default function Home() {
  const { keyword, setKeyword, loading, error, result, searchImmediately } =
    useSearch();
  const [scannedProduct] = useState<Product | undefined>(undefined);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
  const [showConsole, setShowConsole] = useState(false);
  const [showProductRegistration, setShowProductRegistration] = useState(false);
  const [unregisteredBarcode, setUnregisteredBarcode] = useState<string>('');
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string>('');

  const openBarcode = () => {
    if (window?.ReactNativeWebView) {
      window?.ReactNativeWebView?.postMessage('scanBarcode');
    } else {
      console.warn('React Native WebView가 감지되지 않음');

      // 개발 환경에서는 테스트용 바코드 입력 창 표시
      if (process.env.NODE_ENV === 'development') {
        const testBarcode = prompt(
          '테스트용 바코드를 입력하세요 (예: 8801234567890):'
        );
        if (testBarcode) {
          testBarcodeAPI(testBarcode);
        }
      } else {
        alert('앱에서만 바코드 스캔이 가능합니다');
      }
    }
  };

  // 테스트용 바코드 API 호출 함수
  const testBarcodeAPI = async (barcode: string) => {
    setBarcodeLoading(true);
    setScannedBarcode(barcode);

    try {
      const response = await fetch(`/api/barcode/lookup?barcode=${barcode}`);
      const data = await response.json();

      // 실제 바코드 스캔 결과와 동일한 형태로 처리
      const messageEvent = new MessageEvent('message', {
        data: JSON.stringify(data),
      });

      window.dispatchEvent(messageEvent);
    } catch (error) {
      console.error('바코드 테스트 API 호출 오류:', error);

      // 오류 시 barcode_error 타입으로 처리
      const errorData = {
        type: 'barcode_error',
        data: { barcode },
        error: '바코드 조회 중 오류가 발생했습니다.',
      };

      const messageEvent = new MessageEvent('message', {
        data: JSON.stringify(errorData),
      });

      window.dispatchEvent(messageEvent);
    } finally {
      setBarcodeLoading(false);
      setScannedBarcode('');
    }
  };

  const handleProductClick = (product: Product) => {
    if (product.link) {
      window.open(product.link, '_blank');
    }
  };

  // 상품 등록 핸들러
  const handleProductRegistration = async (
    productData: ProductRegistrationData
  ) => {
    try {
      const response = await fetch('/api/products/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      const result = await response.json();

      if (response.ok) {
        // 성공 메시지 표시
        alert(
          `✅ 상품 등록 완료!\n\n상품명: ${productData.productName}\n바코드: ${productData.barcode}\n\n이제 이 상품으로 가격 비교를 시작합니다.`
        );

        // 등록된 상품으로 검색 실행
        setKeyword(productData.productName);
        searchImmediately(productData.productName);

        // 등록 폼 닫기
        setShowProductRegistration(false);
        setUnregisteredBarcode('');
      } else {
        console.error('❌ 상품 등록 실패:', result);
        alert(
          `❌ 상품 등록 실패\n\n${result.error || '알 수 없는 오류가 발생했습니다.'}`
        );
      }
    } catch (error) {
      console.error('💥 상품 등록 중 오류:', error);
      alert(
        '❌ 상품 등록 중 오류가 발생했습니다.\n네트워크 연결을 확인해주세요.'
      );
    }
  };

  // 상품 등록 취소 핸들러
  const handleRegistrationCancel = () => {
    setShowProductRegistration(false);
    setUnregisteredBarcode('');

    // 취소 시 바코드 번호로라도 검색해보기
    if (unregisteredBarcode) {
      setKeyword(unregisteredBarcode);
      searchImmediately(unregisteredBarcode);
    }
  };

  // Console 로그 캡처
  useEffect(() => {
    /* eslint-disable no-console */
    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
    };

    const addConsoleLog = (
      level: 'log' | 'warn' | 'error',
      message: string,
      data?: unknown
    ) => {
      const logEntry: ConsoleLog = {
        level,
        message,
        timestamp: new Date().toLocaleTimeString(),
        data,
      };
      setConsoleLogs((prev) => [logEntry, ...prev].slice(0, 50)); // 최대 50개까지만 저장
    };

    // console.log 오버라이드
    console.log = (...args: unknown[]) => {
      originalConsole.log(...args);
      const message = args
        .map((arg) =>
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        )
        .join(' ');
      addConsoleLog('log', message, args.length > 1 ? args : undefined);
    };

    // console.warn 오버라이드
    console.warn = (...args: unknown[]) => {
      originalConsole.warn(...args);
      const message = args
        .map((arg) =>
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        )
        .join(' ');
      addConsoleLog('warn', message, args.length > 1 ? args : undefined);
    };

    // console.error 오버라이드
    console.error = (...args: unknown[]) => {
      originalConsole.error(...args);
      const message = args
        .map((arg) =>
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        )
        .join(' ');
      addConsoleLog('error', message, args.length > 1 ? args : undefined);
    };

    // 컴포넌트 언마운트 시 원래 console 복원
    return () => {
      console.log = originalConsole.log;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
    };
    /* eslint-enable no-console */
  }, []);

  // searchImmediately를 useCallback으로 감싸기
  const memoizedSearchImmediately = useCallback(
    (query: string, skipExtraction?: boolean) => {
      searchImmediately(query, skipExtraction);
    },
    [searchImmediately]
  );

  // 바코드 스캔 결과 처리 및 메시지 표시
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const data: BarcodeMessageData =
          typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

        // 새로운 바코드 스캔 데이터 형식 처리
        if (data?.type === 'barcode_scanned' && data?.data?.barcode) {
          const { barcode, scanId, timestamp: _timestamp } = data.data;
          console.warn(`바코드 스캔됨: ${barcode} (scanId: ${scanId})`);

          setBarcodeLoading(true);
          setScannedBarcode(barcode);

          // 바코드 조회 API 호출
          fetch(`/api/barcode/lookup?barcode=${barcode}`)
            .then((response) => response.json())
            .then((apiData) => {
              // API 응답을 기존 형식으로 변환하여 처리
              const messageEvent = new MessageEvent('message', {
                data: JSON.stringify(apiData),
              });
              window.dispatchEvent(messageEvent);
            })
            .catch((error) => {
              console.error('바코드 조회 API 호출 오류:', error);
              // 오류 시 barcode_error 타입으로 처리
              const errorData = {
                type: 'barcode_error',
                data: { barcode },
                error: '바코드 조회 중 오류가 발생했습니다.',
              };
              const messageEvent = new MessageEvent('message', {
                data: JSON.stringify(errorData),
              });
              window.dispatchEvent(messageEvent);
            })
            .finally(() => {
              setBarcodeLoading(false);
              setScannedBarcode('');
            });
          return; // 추가 처리 방지
        }

        // 기존 바코드 스캔 결과 처리 (API 응답)
        if (
          data?.type &&
          ['barcode_success', 'barcode_not_found', 'barcode_error'].includes(
            data.type
          )
        ) {
          // 성공한 경우 검색어로 설정하고 즉시 검색 실행
          if (data.type === 'barcode_success' && data.data?.productInfo) {
            // keyword가 있으면 keyword를, 없으면 productName을 사용
            const searchTerm =
              data.data.productInfo.keyword ||
              data.data.productInfo.productName;
            // 바코드 조회로 받은 모든 상품은 keyword 추출 건너뛰기
            // (로컬 DB는 저장된 keyword 사용, 외부 API는 이미 제조사명 제거된 상태)
            const shouldSkipExtraction = true;
            setKeyword(searchTerm);
            memoizedSearchImmediately(searchTerm, shouldSkipExtraction);
          } else if (data.data?.barcode) {
            const barcode = data.data.barcode;

            // 제품을 찾지 못한 경우 등록 폼 표시 (검색하지 않음)
            if (data.type === 'barcode_not_found') {
              setUnregisteredBarcode(barcode);
              setShowProductRegistration(true);
              return; // 추가적인 처리 방지
            }
            // 오류가 발생한 경우에만 바코드 번호로 검색 시도
            else if (data.type === 'barcode_error') {
              setKeyword(barcode);
              memoizedSearchImmediately(barcode);
            }
          }
        }
        // 기존 바코드 형식 호환성 유지
        else if (data?.type === 'barcode' && data?.barcode) {
          setKeyword(data.barcode);
        }
      } catch (error) {
        console.error('메시지 파싱 오류:', error, event.data);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [setKeyword, memoizedSearchImmediately]);

  return (
    <main className="min-h-screen-safe bg-gradient-to-br from-orange-50 via-white to-orange-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float" />
      <div className="absolute top-40 right-20 w-40 h-40 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float-delayed" />
      <div className="absolute bottom-20 left-20 w-48 h-48 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float" />

      <div className="max-w-lg mx-auto p-4 relative z-10">
        {/* 디버그 콘솔 */}
        {showConsole && (
          <div className="fixed bottom-20 left-4 right-4 bg-black/90 text-white p-4 rounded-lg max-h-60 overflow-y-auto z-50">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold">Console Logs</span>
              <button
                onClick={() => setShowConsole(false)}
                className="text-xs bg-red-500 px-2 py-1 rounded"
              >
                Close
              </button>
            </div>
            <div className="text-xs font-mono space-y-1">
              {consoleLogs.map((log, index) => (
                <div
                  key={index}
                  className={`${
                    log.level === 'error'
                      ? 'text-red-400'
                      : log.level === 'warn'
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                  }`}
                >
                  <span className="text-gray-500">[{log.timestamp}]</span>{' '}
                  {log.message}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 상품 등록 폼 모달 */}
        {showProductRegistration && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <ProductRegistrationForm
                initialBarcode={unregisteredBarcode}
                onSubmit={handleProductRegistration}
                onCancel={handleRegistrationCancel}
              />
            </div>
          </div>
        )}

        {/* 헤더 섹션 */}
        <div className="mb-8 mt-safe-top">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">
              <span className="gradient-text">{APP_CONFIG.APP_NAME}</span>
            </h1>
            <span className="text-sm text-gray-500">v1.0.0</span>
          </div>

          {/* 검색 입력 및 바코드 버튼 */}
          <div className="glass-card rounded-3xl p-6 shadow-card transition-all duration-300 hover:shadow-card-hover">
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="상품명을 검색해주세요"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </div>
              <Button onClick={openBarcode} className="bg-gradient-primary">
                <span role="img" aria-label="바코드">
                  📷
                </span>
              </Button>
            </div>
          </div>
        </div>

        {/* 결과 섹션 */}
        <div className="space-y-6">
          {/* 바코드 조회 로딩 상태 */}
          {barcodeLoading && (
            <div className="glass-card rounded-3xl p-12 text-center bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
              <div className="inline-flex items-center justify-center mb-4">
                <div className="animate-pulse">
                  <span className="text-6xl">📱</span>
                </div>
              </div>
              <div className="mb-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
                  <span className="text-blue-700 font-medium">
                    바코드 조회 중...
                  </span>
                </div>
              </div>
              {scannedBarcode && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">스캔된 바코드</p>
                  <p className="font-mono text-lg font-bold text-gray-900 bg-white px-3 py-2 rounded-lg inline-block">
                    {scannedBarcode}
                  </p>
                </div>
              )}
              <div className="mt-6 flex items-center justify-center gap-1">
                <div
                  className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <div
                  className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <div
                  className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
            </div>
          )}

          {/* 일반 검색 로딩 상태 */}
          {loading && !barcodeLoading && (
            <div className="glass-card rounded-3xl p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent" />
              <p className="mt-4 text-gray-600">검색 중...</p>
            </div>
          )}

          {/* 에러 상태 */}
          {error && !barcodeLoading && (
            <div className="glass-card rounded-3xl p-8 bg-red-50 border-2 border-red-200">
              <p className="text-red-600 text-center">{error}</p>
            </div>
          )}

          {/* 검색 결과 */}
          {!loading &&
            !barcodeLoading &&
            result &&
            result.products.length > 0 && (
              <>
                <div className="text-center mb-4">
                  <span className="inline-block px-4 py-2 bg-gradient-primary text-white rounded-full text-sm font-semibold shadow-lg">
                    {result.products.length}개의 상품을 찾았습니다
                  </span>
                </div>
                <div className="grid gap-4">
                  {result.products.map((product, index) => (
                    <ProductCard
                      key={`${product.name}-${index}`}
                      product={product}
                      onBuyClick={() => handleProductClick(product)}
                    />
                  ))}
                </div>
              </>
            )}

          {/* 스캔된 상품 정보 (있을 경우) */}
          {scannedProduct && !barcodeLoading && (
            <div className="glass-card rounded-3xl p-6 bg-blue-50 border-2 border-blue-200">
              <h3 className="font-bold text-blue-800 mb-2">스캔된 상품 정보</h3>
              <p className="text-blue-600">
                상품명: {scannedProduct.name}
                <br />
                가격: {scannedProduct.price}
              </p>
            </div>
          )}

          {/* 초기 상태 */}
          {!loading &&
            !barcodeLoading &&
            !error &&
            (!result || result.products.length === 0) &&
            !keyword && (
              <div className="glass-card rounded-3xl p-12 text-center">
                <div className="text-6xl mb-4">🛒</div>
                <h2 className="text-xl font-bold text-gray-700 mb-2">
                  가격 비교를 시작해보세요
                </h2>
                <p className="text-gray-500">
                  상품명을 검색하거나
                  <br />
                  바코드를 스캔해주세요
                </p>
              </div>
            )}

          {/* 검색 결과 없음 */}
          {!loading &&
            !barcodeLoading &&
            !error &&
            keyword &&
            result &&
            result.products.length === 0 && (
              <div className="glass-card rounded-3xl p-12 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h2 className="text-xl font-bold text-gray-700 mb-2">
                  검색 결과가 없습니다
                </h2>
                <p className="text-gray-500">다른 검색어를 입력해주세요</p>
              </div>
            )}
        </div>

        {/* 디버그 버튼 (개발 모드에서만 표시) */}
        {process.env.NODE_ENV === 'development' && (
          <button
            onClick={() => setShowConsole(!showConsole)}
            className="fixed bottom-4 right-4 bg-gray-800 text-white px-3 py-2 rounded-full text-xs z-40"
          >
            Console {consoleLogs.length > 0 && `(${consoleLogs.length})`}
          </button>
        )}
      </div>
    </main>
  );
}
