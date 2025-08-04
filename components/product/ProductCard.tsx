import Image from 'next/image';
import { Product } from '@/types';
import { Card, Button } from '@/components/common';
import { formatPrice, truncateText } from '@/utils/formatters';
import { UI_CONFIG } from '@/utils/constants';

interface ProductCardProps {
  product: Product;
  comparisonProduct?: Product;
  onBuyClick?: () => void;
}

export function ProductCard({
  product,
  comparisonProduct,
  onBuyClick,
}: ProductCardProps) {
  const priceDifference = comparisonProduct
    ? product.price - comparisonProduct.price
    : 0;

  return (
    <Card
      className="hover:scale-[1.02] transition-all duration-300 group overflow-hidden relative"
      padding="lg"
    >
      {/* Hover effect background */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-orange-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      <div className="relative z-10 flex items-start gap-6">
        <div className="flex-shrink-0">
          {product.imageUrl ? (
            <div className="relative group/image">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-200 to-orange-300 rounded-2xl blur-lg opacity-0 group-hover/image:opacity-30 transition-opacity duration-300"></div>
              <Image
                src={product.imageUrl}
                alt={product.name}
                width={120}
                height={120}
                className="relative rounded-2xl object-cover shadow-lg group-hover:shadow-xl transition-shadow duration-300"
              />
              <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-sm font-bold">🛒</span>
              </div>
            </div>
          ) : (
            <div className="relative group/image">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-200 to-orange-300 rounded-2xl blur-lg opacity-0 group-hover/image:opacity-30 transition-opacity duration-300"></div>
              <div className="relative w-[120px] h-[120px] bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl relative flex items-center justify-center">
                  <span className="text-white text-4xl">📦</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 space-y-5">
          <div>
            <h3 className="font-bold text-gray-900 text-xl leading-snug mb-3 group-hover:text-orange-700 transition-colors duration-200">
              {truncateText(product.name, UI_CONFIG.MAX_PRODUCT_NAME_LENGTH)}
            </h3>

            <div className="flex items-center gap-3 mb-4">
              <span className="px-4 py-2 bg-gradient-to-r from-orange-100 to-orange-200 text-orange-700 text-sm font-bold rounded-full border border-orange-200">
                {product.storeName || '쿠팡'}
              </span>
              <div className="flex items-center gap-1 text-yellow-500">
                <span className="text-sm">★★★★★</span>
                <span className="text-xs text-gray-500 ml-1">(4.8)</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-black text-gray-900 group-hover:text-orange-600 transition-colors duration-200">
                {formatPrice(product.price)}
              </span>
              <span className="text-sm text-gray-500">원</span>
            </div>

            {/* Price comparison badge */}
            {comparisonProduct && priceDifference !== 0 && (
              <div
                className={`p-4 rounded-2xl text-base font-bold border-2 ${
                  priceDifference > 0
                    ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border-green-200'
                    : 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {priceDifference > 0 ? '💰' : '📈'}
                  </span>
                  <span>
                    {priceDifference > 0
                      ? `${formatPrice(Math.abs(priceDifference))} 더 저렴해요!`
                      : `현재 상품이 ${formatPrice(Math.abs(priceDifference))} 더 비싸요`}
                  </span>
                </div>
              </div>
            )}
          </div>

          <Button
            variant="primary"
            size="md"
            fullWidth
            onClick={onBuyClick}
            icon="🛍️"
            className="mt-6 h-14 text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300"
          >
            쿠팡에서 구매하기
          </Button>
        </div>
      </div>
    </Card>
  );
}
