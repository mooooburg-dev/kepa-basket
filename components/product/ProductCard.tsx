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
    <Card>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              width={80}
              height={80}
              className="rounded-lg object-cover"
            />
          ) : (
            <div className="w-20 h-20 bg-yellow-100 rounded-lg flex items-center justify-center">
              <div className="w-12 h-12 bg-yellow-300 rounded-full relative">
                <div className="absolute top-1 left-1 w-2 h-2 bg-orange-400 rounded-full"></div>
                <div className="absolute bottom-1 right-1 w-3 h-3 bg-orange-500 rounded-full"></div>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <h3 className="font-medium text-black">
            {truncateText(product.name, UI_CONFIG.MAX_PRODUCT_NAME_LENGTH)}
          </h3>

          <div className="flex items-center space-x-2">
            <span className="text-blue-600 font-semibold">
              {product.storeName || 'coupang'}
            </span>
            <span className="text-black font-bold">
              {formatPrice(product.price)}
            </span>
          </div>

          {comparisonProduct && priceDifference !== 0 && (
            <p className="text-sm text-gray-600">
              {priceDifference > 0
                ? `쿠팡이 ${formatPrice(Math.abs(priceDifference))} 더 저렴해요`
                : `현재 상품이 ${formatPrice(
                    Math.abs(priceDifference)
                  )} 더 저렴해요`}
            </p>
          )}

          <Button variant="outline" size="sm" fullWidth onClick={onBuyClick}>
            쿠팡에서 구매하기
          </Button>
        </div>
      </div>
    </Card>
  );
}
