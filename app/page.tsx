'use client';

import { useState, useEffect } from 'react';
import { Button, Input } from '@/components/common';
import { ProductCard } from '@/components/product';
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

export default function Home() {
  const { keyword, setKeyword, loading, error, result, searchImmediately } =
    useSearch();
  const [scannedProduct] = useState<Product | undefined>(undefined);
  const [consoleLogs, setConsoleLogs] = useState<
    Array<{
      level: 'log' | 'warn' | 'error';
      message: string;
      timestamp: string;
      data?: any;
    }>
  >([]);
  const [showConsole, setShowConsole] = useState(false);

  const openBarcode = () => {
    console.log('바코드 스캔 버튼 클릭됨');
    if (window?.ReactNativeWebView) {
      console.log(
        'React Native WebView가 감지됨. scanBarcode 메시지 전송중...'
      );
      window?.ReactNativeWebView?.postMessage('scanBarcode');
    } else {
      console.log('React Native WebView가 감지되지 않음');
      alert('앱에서만 바코드 스캔이 가능합니다');
    }
  };

  const handleProductClick = (product: Product) => {
    if (product.link) {
      window.open(product.link, '_blank');
    }
  };

  // Console 로그 캡처
  useEffect(() => {
    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
    };

    const addConsoleLog = (
      level: 'log' | 'warn' | 'error',
      message: string,
      data?: any
    ) => {
      const logEntry = {
        level,
        message,
        timestamp: new Date().toLocaleTimeString(),
        data,
      };
      setConsoleLogs((prev) => [logEntry, ...prev].slice(0, 50)); // 최대 50개까지만 저장
    };

    // console.log 오버라이드
    console.log = (...args: any[]) => {
      originalConsole.log(...args);
      const message = args
        .map((arg) =>
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        )
        .join(' ');
      addConsoleLog('log', message, args.length > 1 ? args : undefined);
    };

    // console.warn 오버라이드
    console.warn = (...args: any[]) => {
      originalConsole.warn(...args);
      const message = args
        .map((arg) =>
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        )
        .join(' ');
      addConsoleLog('warn', message, args.length > 1 ? args : undefined);
    };

    // console.error 오버라이드
    console.error = (...args: any[]) => {
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
  }, []);

  // 바코드 스캔 결과 처리 및 메시지 표시
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // React Native WebView에서 온 메시지인지 확인
      console.log('메시지 수신 이벤트:', {
        data: event.data,
        origin: event.origin,
        source: event.source,
      });

      try {
        const data =
          typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        console.log('파싱된 데이터:', data);

        // 바코드 스캔 결과 처리
        if (
          data?.type &&
          ['barcode_success', 'barcode_not_found', 'barcode_error'].includes(
            data.type
          )
        ) {
          console.log('바코드 스캔 결과 수신:', data);

          // 성공한 경우 검색어로 설정하고 즉시 검색 실행
          if (
            data.type === 'barcode_success' &&
            data.data?.productInfo?.productName
          ) {
            const productName = data.data.productInfo.productName;
            
            setKeyword(productName);
            console.log(
              '🔍 바코드 스캔 성공! 자동 가격 비교 검색 시작:',
              productName
            );
            searchImmediately(productName);
          } else if (data.data?.barcode) {
            const barcode = data.data.barcode;
            
            setKeyword(barcode);
            console.log('🔍 바코드 번호로 검색 시작:', barcode);
            searchImmediately(barcode);
          }
        }
        // 기존 바코드 형식 호환성 유지
        else if (data?.type === 'barcode' && data?.barcode) {
          console.log('기존 바코드 데이터 설정:', data.barcode);
          setKeyword(data.barcode);
        }
      } catch (error) {
        console.error('메시지 파싱 오류:', error, event.data);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [setKeyword]);

  return (
    <main className="min-h-screen-safe bg-gradient-to-br from-orange-50 via-white to-orange-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-200/30 to-orange-300/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-orange-100/40 to-orange-200/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-orange-100/20 to-orange-200/20 rounded-full blur-3xl"></div>
      </div>

      <div className="container-mobile max-w-md mx-auto px-6 py-8 relative z-10">
        {/* Enhanced Header Section */}
        <div className="text-center mb-16">
          <div className="mb-10">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full blur-xl opacity-30 animate-pulse"></div>
              <div className="relative p-8 bg-white rounded-full shadow-2xl mb-8 border-4 border-orange-100">
                <span className="text-7xl">🛒</span>
              </div>
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gradient mb-6 leading-tight tracking-tight">
            {APP_CONFIG.APP_NAME}
          </h1>
          <p className="text-gray-600 text-xl font-medium leading-relaxed max-w-sm mx-auto">
            {APP_CONFIG.APP_DESCRIPTION}
          </p>

          {/* Feature highlights */}
          <div className="flex justify-center items-center gap-6 mt-8">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
              <span>실시간 가격 비교</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
              <span>바코드 스캔</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
              <span>최저가 알림</span>
            </div>
          </div>
        </div>

        {/* Enhanced Search Actions Section */}
        <div className="glass-card rounded-3xl p-8 mb-12">
          <div className="space-y-8">
            {/* Enhanced Barcode Button */}
            <div className="relative">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={openBarcode}
                icon="📷"
                className="h-20 text-xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 relative overflow-hidden group"
              >
                <span className="relative z-10">바코드 스캔하여 가격 비교</span>
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Button>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-orange-500 rotate-45"></div>
            </div>

            {/* Enhanced Divider */}
            <div className="flex items-center my-10">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
              <div className="px-8 py-2 bg-white rounded-full shadow-sm border border-gray-200">
                <span className="text-gray-500 font-semibold text-sm">
                  또는
                </span>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
            </div>

            {/* Enhanced Search Input */}
            <div className="relative group">
              <Input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="상품명을 직접 검색해보세요"
                leftIcon={
                  <svg
                    className="w-6 h-6 text-gray-400 group-focus-within:text-orange-500 transition-colors duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                }
                className="h-16 text-lg search-input"
              />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-500/10 to-orange-600/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          </div>
        </div>

        {/* Console 로그 표시 섹션 */}
        {showConsole && consoleLogs.length > 0 && (
          <div className="glass-card rounded-3xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-lg">🖥️</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                Console 로그 ({consoleLogs.length})
              </h3>
              <div className="ml-auto flex gap-2 flex-wrap">
                <button
                  onClick={() => setConsoleLogs([])}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  지우기
                </button>
              </div>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {consoleLogs.map((log, index) => (
                <div
                  key={index}
                  className={`rounded-xl p-3 border text-sm ${
                    log.level === 'error'
                      ? 'bg-red-50 border-red-200 text-red-800'
                      : log.level === 'warn'
                        ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                        : 'bg-white border-gray-200 text-gray-800'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span
                      className={`text-xs font-mono px-2 py-1 rounded ${
                        log.level === 'error'
                          ? 'bg-red-100 text-red-700'
                          : log.level === 'warn'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {log.level.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500 font-mono">
                      {log.timestamp}
                    </span>
                  </div>
                  <div className="font-mono text-xs leading-relaxed">
                    {log.message}
                  </div>
                  {log.data && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                        상세 데이터 보기
                      </summary>
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enhanced Content Section */}
        <div className="space-y-8">
          {/* Enhanced Loading State */}
          {loading && (
            <div className="glass-card rounded-3xl p-16 text-center fade-in">
              <div className="relative mb-10">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-200 to-orange-300 rounded-full blur-xl opacity-30 animate-pulse"></div>
                <div className="relative inline-block w-24 h-24 rounded-full loading-spinner border-4"></div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                가격을 비교하고 있어요...
              </h3>
              <p className="text-gray-500 text-lg">잠시만 기다려주세요</p>
              <div className="mt-6 flex justify-center gap-2">
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.1s' }}
                ></div>
                <div
                  className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                ></div>
              </div>
            </div>
          )}

          {/* Enhanced Error State */}
          {error && (
            <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 rounded-3xl p-10 fade-in">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-3xl">⚠️</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-red-800 mb-4 text-xl">
                    오류가 발생했어요
                  </h3>
                  <p className="text-red-700 text-lg leading-relaxed">
                    {error}
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors duration-200"
                  >
                    다시 시도하기
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Search Results */}
          {result && result.products.length > 0 && (
            <div className="space-y-8 fade-in">
              <div className="glass-card rounded-3xl p-8">
                <div className="flex items-center gap-6 mb-8">
                  <div className="p-4 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl">
                    <span className="text-3xl">🎯</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      검색 결과
                    </h2>
                    <p className="text-lg text-gray-500">
                      총{' '}
                      <span className="text-orange-500 font-bold text-xl">
                        {result.products.length}개
                      </span>
                      의 상품을 찾았어요
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {result.products.map((product, index) => (
                  <div
                    key={`${product.id}-${index}`}
                    className="fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <ProductCard
                      product={product}
                      comparisonProduct={scannedProduct}
                      onBuyClick={() => handleProductClick(product)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Enhanced No Results */}
          {result && result.products.length === 0 && (
            <div className="glass-card rounded-3xl p-16 text-center fade-in">
              <div className="mb-10">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full blur-xl opacity-30"></div>
                  <div className="relative p-8 bg-gray-100 rounded-full mb-8">
                    <span className="text-6xl">🔍</span>
                  </div>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                검색 결과를 찾을 수 없어요
              </h3>
              <p className="text-gray-600 text-lg leading-relaxed mb-8">
                다른 키워드로 다시 검색해보세요
              </p>
              <div className="flex justify-center gap-4">
                <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Footer Spacing */}
        <div className="h-16"></div>
      </div>

      {/* Console 토글 버튼 (플로팅) */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setShowConsole(!showConsole)}
          className={`w-14 h-14 rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center text-white font-bold text-lg ${
            showConsole
              ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
              : consoleLogs.length > 0
                ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                : 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700'
          }`}
        >
          {showConsole ? '✕' : '🖥️'}
        </button>
        {consoleLogs.length > 0 && !showConsole && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {consoleLogs.length > 99 ? '99+' : consoleLogs.length}
          </div>
        )}
      </div>
    </main>
  );
}
