# Next Step

## Goal

React UI를 실제 사용 흐름 기준으로 점검하면서, FastAPI 단일 서버 구조 위에서 화면/데이터/문구를 안정화한다.

## Priority 1: UI Smoke Check

- `uvicorn app.main:app --host 127.0.0.1 --port 8000`로 서버 실행
- `http://127.0.0.1:8000/` 접속 후 로그인 화면 확인
- 로그인 -> 포트폴리오 목록 -> 포트폴리오 상세 -> 분석 -> 프롬프트 화면까지 순차 점검
- 브라우저 콘솔 에러, 네트워크 에러, 4xx/5xx 응답 확인
- 모바일 폭(`<= 768px`)과 데스크톱 폭에서 레이아웃 깨짐 여부 확인

## Priority 2: API / UI Mapping Review

- 포트폴리오 목록 카드의 금액/손익 계산이 화면 의도와 맞는지 확인
- 종목 생성/수정 시 `market`, `currency`, `current_price` 입력 UX 보완 필요 여부 확인
- 분석 화면 뉴스/이벤트/가격 추이 응답 필드가 충분한지 확인
- 프롬프트 CRUD 동작과 포트폴리오 연결 표시가 자연스러운지 확인
- 필요 시 React 전용 response schema 추가 여부 검토

## Priority 3: Copy and UX Polish

- 한글 문구 전반 점검
- 버튼/빈 상태/에러 메시지 문구 정리
- 포트폴리오 및 종목 생성 성공 후 피드백 방식 정리
- 로그인 후 현재 사용자 표시와 로그아웃 동작 확인

## Priority 4: Data / Backend Hardening

- `data/*.csv` 신규 컬럼 스키마 마이그레이션 안정성 재점검
- prompts CSV가 없는 초기 상태에서도 정상 동작하는지 재확인
- holdings/portfolios 삭제 시 연관 데이터 정합성 확인
- 외부 시세/뉴스 refresh 실패 시 fallback UX 보완

## Priority 5: Build / Deploy Hygiene

- `ui/dist` 재빌드 없이 서버 실행 시 안내 문구가 적절한지 확인
- 정적 파일 캐시 전략이 필요한지 검토
- 번들 크기 경고 대응 여부 판단
  - dynamic import 도입
  - manual chunk 분리

## Suggested Work Order

1. 실제 브라우저에서 전체 사용자 플로우 점검
2. 발견된 API 응답/문구/레이아웃 문제 정리
3. 프론트 문구와 레이아웃 세부 수정
4. 백엔드 응답 shape 보완
5. 빌드 최적화와 운영 편의 정리

## Done Definition

- 로그인부터 포트폴리오/종목/분석/프롬프트까지 주요 플로우가 브라우저에서 정상 동작
- 콘솔 에러와 치명적 API 오류 없음
- README 실행 절차대로 재현 가능
- 단일 서버 구조에서 `/` 진입 시 React UI가 안정적으로 제공됨
