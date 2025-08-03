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
    <Card className="hover:scale-[1.02] transition-transform duration-300" padding="lg">
      <div className="flex items-start gap-6">
        <div className="flex-shrink-0">
          {product.imageUrl ? (
            <div className="relative">
              <Image
                src={product.imageUrl}
                alt={product.name}
                width={100}
                height={100}
                className="rounded-2xl object-cover shadow-md"
              />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">🛒</span>
              </div>
            </div>
          ) : (
            <div className="w-[100px] h-[100px] bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center shadow-md">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl relative flex items-center justify-center">
                <span className="text-white text-3xl">📦</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 space-y-4">
          <h3 className="font-semibold text-gray-900 text-lg leading-snug">
            {truncateText(product.name, UI_CONFIG.MAX_PRODUCT_NAME_LENGTH)}
          </h3>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="px-4 py-2 bg-orange-100 text-orange-700 text-sm font-semibold rounded-full">
                {product.storeName || '쿠팡'}
              </span>
            </div>
            
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-gray-900">
                {formatPrice(product.price)}
              </span>
            </div>
          </div>

          {comparisonProduct && priceDifference !== 0 && (
            <div className={`p-4 rounded-2xl text-base font-medium ${
              priceDifference > 0 
                ? 'bg-green-50 text-green-700 border-2 border-green-200'
                : 'bg-blue-50 text-blue-700 border-2 border-blue-200'
            }`}>
              {priceDifference > 0
                ? `💰 ${formatPrice(Math.abs(priceDifference))} 더 저렴해요!`
                : `📈 현재 상품이 ${formatPrice(Math.abs(priceDifference))} 더 비싸요`}
            </div>
          )}

          <Button 
            variant="primary" 
            size="md" 
            fullWidth 
            onClick={onBuyClick}
            icon="🛍️"
            className="mt-6"
          >
            쿠팡에서 구매하기
          </Button>
        </div>
      </div>
    </Card>
  );
}
