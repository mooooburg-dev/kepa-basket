'use client';

import { useState } from 'react';
import { Button, Input } from '@/components/common';

interface ProductRegistrationData {
  barcode: string;
  productName: string;
  company: string;
  country: string;
  category: string;
  description?: string;
}

interface ProductRegistrationFormProps {
  initialBarcode: string;
  onSubmit: (data: ProductRegistrationData) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ProductRegistrationForm({
  initialBarcode,
  onSubmit,
  onCancel,
  loading = false,
}: ProductRegistrationFormProps) {
  const [formData, setFormData] = useState<ProductRegistrationData>({
    barcode: initialBarcode,
    productName: '',
    company: '',
    country: '대한민국',
    category: '',
    description: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.productName.trim()) {
      newErrors.productName = '상품명을 입력해주세요';
    }
    if (!formData.company.trim()) {
      newErrors.company = '제조사를 입력해주세요';
    }
    if (!formData.country.trim()) {
      newErrors.country = '제조국가를 입력해주세요';
    }
    if (!formData.category.trim()) {
      newErrors.category = '카테고리를 입력해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (
    field: keyof ProductRegistrationData,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // 에러가 있던 필드는 입력 시 에러 제거
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const commonCategories = [
    '식품',
    '생활용품',
    '화장품',
    '의약품',
    '의류',
    '전자제품',
    '도서',
    '완구',
    '기타',
  ];

  const commonCountries = [
    '대한민국',
    '미국',
    '일본',
    '중국',
    '독일',
    '프랑스',
    '이탈리아',
    '기타',
  ];

  return (
    <div className="glass-card rounded-3xl p-8 max-w-2xl mx-auto">
      {/* 헤더 */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
          <span className="text-2xl">📝</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">상품 등록</h2>
        <p className="text-gray-600">
          스캔한 바코드에 해당하는 상품 정보를 등록해주세요
        </p>
      </div>

      {/* 바코드 정보 */}
      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="text-orange-600 font-semibold">스캔된 바코드:</span>
          <span className="font-mono text-lg font-bold text-orange-800">
            {initialBarcode}
          </span>
        </div>
      </div>

      {/* 등록 폼 */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 상품명 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            상품명 <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            value={formData.productName}
            onChange={(e) => handleInputChange('productName', e.target.value)}
            placeholder="예: 삼성우유 1L"
            error={errors.productName}
            className="h-12"
          />
        </div>

        {/* 제조사 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            제조사 <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            value={formData.company}
            onChange={(e) => handleInputChange('company', e.target.value)}
            placeholder="예: 삼성유업"
            error={errors.company}
            className="h-12"
          />
        </div>

        {/* 제조국가 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            제조국가 <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            <select
              value={formData.country}
              onChange={(e) => handleInputChange('country', e.target.value)}
              className="w-full h-12 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
            >
              {commonCountries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
            {formData.country === '기타' && (
              <Input
                type="text"
                placeholder="직접 입력해주세요"
                onChange={(e) => handleInputChange('country', e.target.value)}
                className="h-12"
              />
            )}
          </div>
          {errors.country && (
            <p className="text-red-500 text-sm mt-1">{errors.country}</p>
          )}
        </div>

        {/* 카테고리 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            카테고리 <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full h-12 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
            >
              <option value="">카테고리를 선택해주세요</option>
              {commonCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {formData.category === '기타' && (
              <Input
                type="text"
                placeholder="직접 입력해주세요"
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="h-12"
              />
            )}
          </div>
          {errors.category && (
            <p className="text-red-500 text-sm mt-1">{errors.category}</p>
          )}
        </div>

        {/* 상품 설명 (선택사항) */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            상품 설명 (선택사항)
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="상품에 대한 추가 정보를 입력해주세요"
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none"
          />
        </div>

        {/* 버튼 */}
        <div className="flex gap-4 pt-4">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            fullWidth
            onClick={onCancel}
            disabled={loading}
          >
            취소
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            disabled={loading}
          >
            {loading ? '등록 중...' : '상품 등록'}
          </Button>
        </div>
      </form>

      {/* 안내 메시지 */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <div className="flex items-start gap-3">
          <span className="text-blue-600 text-lg flex-shrink-0">💡</span>
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">등록 안내</p>
            <ul className="space-y-1 text-blue-700">
              <li>• 정확한 상품 정보를 입력해주세요</li>
              <li>• 등록된 정보는 가격 비교 검색에 활용됩니다</li>
              <li>• 필수 항목(*)은 반드시 입력해야 합니다</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
