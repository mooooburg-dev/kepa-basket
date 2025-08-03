export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  link?: string;
  storeName?: string;
}

export interface BarcodeResult {
  barcode: string;
  product?: Product;
}

export interface SearchResult {
  keyword: string;
  products: Product[];
  totalCount?: number;
}

export interface PriceComparison {
  scannedProduct: Product;
  coupangProduct?: Product;
  priceDifference?: number;
  savingsPercentage?: number;
}
