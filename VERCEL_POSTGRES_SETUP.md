# Vercel Postgres 설정 가이드

## 1. Vercel 대시보드에서 데이터베이스 생성

1. [Vercel 대시보드](https://vercel.com/dashboard)에 로그인
2. 프로젝트 선택 → **Storage** 탭 이동
3. **Create Database** → **Postgres** 선택
4. 데이터베이스 이름 입력 (예: `kepa-basket-db`)
5. **Create** 버튼 클릭

## 2. 환경 변수 설정

Vercel Postgres 생성 후 자동으로 제공되는 환경 변수들:

```bash
POSTGRES_URL="postgres://username:password@host:port/database"
POSTGRES_PRISMA_URL="postgres://username:password@host:port/database?pgbouncer=true&connect_timeout=15"
POSTGRES_URL_NO_SSL="postgres://username:password@host:port/database?sslmode=disable"
POSTGRES_URL_NON_POOLING="postgres://username:password@host:port/database?sslmode=require"
POSTGRES_USER="username"
POSTGRES_HOST="host"
POSTGRES_PASSWORD="password"
POSTGRES_DATABASE="database"
```

### 로컬 개발환경 설정

`.env.local` 파일 생성:
```bash
cp .env.example .env.local
```

Vercel 대시보드에서 복사한 환경 변수를 `.env.local`에 추가

## 3. 데이터베이스 초기화

애플리케이션 첫 실행 시 자동으로 테이블이 생성됩니다:

```sql
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  barcode VARCHAR(13) UNIQUE NOT NULL,
  product_name TEXT NOT NULL,
  keyword TEXT,
  company TEXT,
  country TEXT,
  category TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 4. 기존 SQLite 데이터 마이그레이션

백업된 데이터(`data/products_backup.csv`)를 PostgreSQL로 가져오기:

### Option A: 수동 SQL 삽입

```sql
INSERT INTO products (barcode, product_name, keyword, company, country, category, description)
VALUES 
  ('8802142000755', '대천김 곱창김', '곱창김', '대천맛김', '대한민국', '식품', ''),
  ('8801234567890', '테스트 상품', '테스트 상품', '테스트 회사', '대한민국', '식품', '테스트용 상품입니다'),
  -- 나머지 데이터...
```

### Option B: API를 통한 등록

애플리케이션 실행 후 각 상품을 API로 등록:

```bash
curl -X POST http://localhost:3000/api/products/register \
  -H "Content-Type: application/json" \
  -d '{
    "barcode": "8802142000755",
    "productName": "대천김 곱창김",
    "keyword": "곱창김",
    "company": "대천맛김",
    "country": "대한민국",
    "category": "식품"
  }'
```

## 5. 헬스체크 확인

데이터베이스 연결 상태 확인:

```bash
curl http://localhost:3000/api/health
```

예상 응답:
```json
{
  "status": "ok",
  "database": {
    "success": true,
    "message": "PostgreSQL 연결 정상",
    "timestamp": "2024-01-20T10:00:00.000Z"
  },
  "environment": "development",
  "timestamp": "2024-01-20T10:00:00.000Z"
}
```

## 6. Vercel 배포

```bash
# 프로덕션 배포
vercel --prod

# 또는 Git push로 자동 배포
git push origin main
```

## 주요 변경사항

### 데이터베이스 계층
- **SQLite** → **PostgreSQL** 마이그레이션
- 동기식 → 비동기식 데이터베이스 작업
- `better-sqlite3` → `@vercel/postgres` 패키지

### API 라우트 업데이트
- `/api/barcode/lookup` - PostgreSQL 비동기 조회
- `/api/products/register` - PostgreSQL 비동기 등록
- `/api/health` - 새로운 헬스체크 엔드포인트

### 에러 처리
- SQLite 오류 코드 → PostgreSQL 오류 코드
- `SQLITE_CONSTRAINT_UNIQUE` → `23505` (unique constraint violation)
- 재시도 로직 제거 (PostgreSQL 연결 안정성)

## 트러블슈팅

### 1. 연결 오류
```
Error: Connection failed
```
- Vercel 대시보드에서 환경 변수 재확인
- 데이터베이스 상태 확인
- 네트워크 연결 확인

### 2. 권한 오류
```
Error: permission denied
```
- Vercel 프로젝트와 데이터베이스가 같은 팀에 있는지 확인
- 데이터베이스 접근 권한 설정 확인

### 3. 스키마 오류
```
Error: relation "products" does not exist
```
- 애플리케이션 재시작으로 자동 초기화 실행
- 수동으로 테이블 생성 쿼리 실행

## 성능 최적화

### 인덱스 생성됨
- `idx_products_barcode` - 바코드 검색 최적화
- `idx_products_keyword` - 키워드 검색 최적화

### 연결 풀링
Vercel Postgres는 자동으로 연결 풀링을 제공하여 성능 최적화됨