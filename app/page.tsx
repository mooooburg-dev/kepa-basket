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
  const { keyword, setKeyword, loading, error, result } = useSearch();
  const [scannedProduct] = useState<Product | undefined>(undefined);

  const openBarcode = () => {
    console.log('바코드 스캔 버튼 클릭됨');
    if (window?.ReactNativeWebView) {
      console.log('React Native WebView가 감지됨. scanBarcode 메시지 전송중...');
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

  // 바코드 스캔 결과 처리
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log('WebView에서 메시지 수신:', event.data);
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        console.log('파싱된 데이터:', data);
        
        if (data?.type === 'barcode' && data?.barcode) {
          console.log('바코드 데이터 설정:', data.barcode);
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
    <main className="min-h-screen-safe bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <div className="container-mobile max-w-md mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="mb-8">
            <div className="inline-block p-6 bg-white rounded-full shadow-xl mb-6">
              <span className="text-6xl">🛒</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gradient mb-4 leading-tight">
            {APP_CONFIG.APP_NAME}
          </h1>
          <p className="text-gray-600 text-lg font-medium leading-relaxed">
            {APP_CONFIG.APP_DESCRIPTION}
          </p>
        </div>

        {/* Search Actions Section */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-10">
          <div className="space-y-6">
            {/* Barcode Button */}
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={openBarcode}
              icon="📷"
              className="h-16 text-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              바코드 스캔하여 가격 비교
            </Button>

            {/* Divider */}
            <div className="flex items-center my-8">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
              <span className="px-6 text-gray-500 font-medium text-base">
                또는
              </span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="상품명을 직접 검색해보세요"
                leftIcon={
                  <svg
                    className="w-5 h-5 text-gray-400"
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
                className="h-14 text-lg"
              />
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="space-y-8">
          {/* Loading State */}
          {loading && (
            <div className="bg-white rounded-3xl shadow-xl p-12 text-center fade-in">
              <div className="inline-block w-20 h-20 rounded-full loading-spinner mb-8 border-4 border-orange-200 border-t-orange-500"></div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                가격을 비교하고 있어요...
              </h3>
              <p className="text-gray-500 text-base">잠시만 기다려주세요</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-8 fade-in">
              <div className="flex items-start gap-5">
                <div className="flex-shrink-0">
                  <span className="text-3xl">⚠️</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-red-800 mb-3 text-lg">
                    오류가 발생했어요
                  </h3>
                  <p className="text-red-700 text-base leading-relaxed">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Search Results */}
          {result && result.products.length > 0 && (
            <div className="space-y-6 fade-in">
              <div className="bg-white rounded-3xl shadow-xl p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      검색 결과
                    </h2>
                    <p className="text-base text-gray-500">
                      총{' '}
                      <span className="text-orange-500 font-semibold">
                        {result.products.length}개
                      </span>
                      의 상품을 찾았어요
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                {result.products.map((product, index) => (
                  <div
                    key={product.id}
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

          {/* No Results */}
          {result && result.products.length === 0 && (
            <div className="bg-white rounded-3xl shadow-xl p-12 text-center fade-in">
              <div className="mb-8">
                <div className="inline-block p-6 bg-gray-100 rounded-full mb-6">
                  <span className="text-5xl">🔍</span>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                검색 결과를 찾을 수 없어요
              </h3>
              <p className="text-gray-600 text-base leading-relaxed">
                다른 키워드로 다시 검색해보세요
              </p>
            </div>
          )}
        </div>

        {/* Footer Spacing */}
        <div className="h-12"></div>
      </div>
    </main>
  );
}
