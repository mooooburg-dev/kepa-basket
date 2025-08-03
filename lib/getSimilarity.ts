import stringSimilarity from 'string-similarity';
import { Product } from '@/types';

export function getBestMatch(keyword: string, items: string[]) {
  const matches = stringSimilarity.findBestMatch(keyword, items);
  return matches.bestMatch;
}

export function findMostSimilarProduct(
  keyword: string,
  products: Product[]
): Product | null {
  if (!products.length) return null;

  const similarities = products.map((product) => ({
    product,
    similarity: stringSimilarity.compareTwoStrings(
      keyword.toLowerCase(),
      product.name.toLowerCase()
    ),
  }));

  const bestMatch = similarities.reduce((prev, current) =>
    prev.similarity > current.similarity ? prev : current
  );

  return bestMatch.similarity > 0.3 ? bestMatch.product : null;
}

export function calculateSimilarityScore(str1: string, str2: string): number {
  return stringSimilarity.compareTwoStrings(
    str1.toLowerCase(),
    str2.toLowerCase()
  );
}
