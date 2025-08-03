# 케파 장바구니 (Kepa Basket)

가격 비교 앱 - 바코드 스캔으로 쿠팡 최저가를 찾아보세요!

## 📱 프로젝트 소개

케파 장바구니는 제품의 바코드를 스캔하여 쿠팡에서 동일하거나 유사한 제품의 가격을 비교할 수 있는 모바일 웹 애플리케이션입니다. React Native WebView 환경에서 작동하도록 설계되었으며, 한국 소비자들이 더 나은 가격으로 쇼핑할 수 있도록 도와줍니다.

## 🚀 주요 기능

- **바코드 스캔**: 모바일 앱과 연동하여 제품 바코드 스캔
- **가격 비교**: 스캔한 제품과 쿠팡 가격 실시간 비교
- **제품 검색**: 제품명으로 직접 검색 가능
- **쿠팡 파트너스 연동**: 쿠팡 API를 통한 실시간 가격 정보 제공

## 🛠 기술 스택

- **프레임워크**: Next.js 15.4.2 (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS 4.1.11
- **주요 라이브러리**:
  - React 19.1.0
  - Axios (API 통신)
  - string-similarity (제품명 매칭)

## 📦 설치 방법

1. 저장소 클론

```bash
git clone https://github.com/[your-username]/kepa-basket.git
cd kepa-basket
```

2. 의존성 설치

```bash
npm install
```

3. 환경 변수 설정
   `.env.local` 파일을 생성하고 쿠팡 파트너스 API 키를 추가하세요:

```env
COUPANG_API_KEY=your_api_key_here
```

4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 📁 프로젝트 구조

```
kepa-basket/
├── app/                    # Next.js App Router
│   ├── page.tsx           # 메인 페이지
│   ├── layout.tsx         # 레이아웃 컴포넌트
│   └── globals.css        # 전역 스타일
├── lib/                   # 유틸리티 함수
│   ├── searchCoupang.ts   # 쿠팡 API 연동
│   └── getSimilarity.ts   # 제품명 매칭 로직
├── public/                # 정적 파일
└── package.json          # 프로젝트 설정
```

## 🔧 스크립트

```bash
npm run dev      # 개발 서버 실행 (Turbopack)
npm run build    # 프로덕션 빌드
npm start        # 프로덕션 서버 실행
npm run lint     # ESLint 실행
```

## 📱 모바일 연동

이 프로젝트는 React Native WebView 환경에서 작동하도록 설계되었습니다:

- `window.ReactNativeWebView.postMessage`를 통한 네이티브 앱 통신
- 모바일 안전 영역(safe area) 대응
- 반응형 디자인

## 🔒 환경 변수

필수 환경 변수:

- `COUPANG_API_KEY`: 쿠팡 파트너스 API 키

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 🚧 개발 상태

현재 초기 개발 단계에 있으며, 다음 기능들이 구현 예정입니다:

- [ ] API 라우트 구현 (보안 강화)
- [ ] 바코드 처리 로직 완성
- [ ] 검색 기능 UI 연결
- [ ] 상태 관리 시스템 구축
- [ ] 가격 히스토리 추적
- [ ] 사용자 알림 기능
