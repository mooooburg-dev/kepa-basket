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
    if (window?.ReactNativeWebView) {
      window?.ReactNativeWebView?.postMessage('scanBarcode');
    } else {
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
      if (event.data?.type === 'barcode' && event.data?.barcode) {
        setKeyword(event.data.barcode);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [setKeyword]);

  return (
    <main className="min-h-screen-safe p-6 pt-safe pb-safe">
      <div className="container-mobile space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gradient">
            {APP_CONFIG.APP_NAME}
          </h1>
          <p className="text-gray-600 text-sm">{APP_CONFIG.APP_DESCRIPTION}</p>
        </div>

        {/* Barcode Button */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={openBarcode}
          className="shadow-lg"
        >
          바코드로 가격 비교
        </Button>

        {/* Search Input */}
        <Input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="상품명을 검색하세요"
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
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          }
        />

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
            <p className="text-gray-600 mt-2">검색 중...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Search Results */}
        {result && result.products.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              검색 결과 ({result.products.length}개)
            </h2>
            {result.products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                comparisonProduct={scannedProduct}
                onBuyClick={() => handleProductClick(product)}
              />
            ))}
          </div>
        )}

        {/* No Results */}
        {result && result.products.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-600">검색 결과가 없습니다.</p>
          </div>
        )}
      </div>
    </main>
  );
}
