# Task Manager API — Design Spec

**Date:** 2026-06-10  
**Purpose:** 코드리뷰 도구 3종 비교용 테스트 프로젝트 (실행 불필요, 리뷰 전용)

---

## 목적

Claude 코드리뷰, 자체 코드리뷰 플러그인, Alibaba 코드리뷰 기능을 토큰 소모량 및 탐지 품질 기준으로 비교하기 위한 NestJS 백엔드 샘플 프로젝트.

---

## 스택

- **Framework:** NestJS + TypeScript
- **ORM:** TypeORM (엔티티 정의만, 실제 DB 연결 불필요)
- **DB (참조용):** PostgreSQL

---

## 모듈 구조

```
src/
├── app.module.ts
├── main.ts
├── users/
│   ├── user.entity.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── users.module.ts
├── projects/
│   ├── project.entity.ts
│   ├── projects.controller.ts
│   ├── projects.service.ts
│   └── projects.module.ts
└── tasks/
    ├── task.entity.ts
    ├── dto/
    │   ├── create-task.dto.ts
    │   └── update-task.dto.ts
    ├── tasks.controller.ts
    ├── tasks.service.ts
    └── tasks.module.ts
```

**관계:** User → (1:N) Project, Project → (1:N) Task, Task → (N:1) User (assignee)

---

## API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| POST | /users | 유저 생성 |
| GET | /users/:id | 유저 조회 |
| POST | /projects | 프로젝트 생성 |
| GET | /projects | 전체 목록 |
| GET | /projects/:id | 단건 조회 |
| DELETE | /projects/:id | 삭제 |
| POST | /tasks | 태스크 생성 |
| GET | /tasks | 전체 목록 |
| GET | /tasks/:id | 단건 조회 |
| PATCH | /tasks/:id | 상태/담당자 수정 |
| DELETE | /tasks/:id | 삭제 |

---

## 의도적 결함 목록

### 컨트롤러 — 에러 핸들링 미흡
- `tasks.controller.ts`: try/catch 없이 서비스 직접 호출, 404 응답 없음
- `projects.controller.ts`: 존재하지 않는 프로젝트에 태스크 추가 시 에러 미처리

### 서비스 — N+1 쿼리
- `tasks.service.ts`: `findAll()`에서 태스크 루프 안에서 assignee를 별도 쿼리로 조회 (JOIN 미사용)
- `projects.service.ts`: 프로젝트 목록에서 각 task count를 루프로 조회

### DTO — 유효성 검사 미흡
- `create-task.dto.ts`: `@IsNotEmpty()` 누락, `dueDate` 타입이 `any`
- `update-task.dto.ts`: PartialType 미사용, 필드 중복 정의

### 엔티티 — 인덱스 누락
- `task.entity.ts`: 자주 쿼리되는 `status`, `assigneeId` 컬럼에 `@Index()` 없음

---

## 정상 구현 범위

- 엔티티 관계 정의 (`@OneToMany`, `@ManyToOne`)
- 서비스 레이어 비즈니스 로직 (CRUD)
- 모듈 간 의존성 주입

---

## 비고

- 실행을 목적으로 하지 않으므로 `DatabaseModule` 실제 연결 설정 생략
- `package.json`, `tsconfig.json`, `nest-cli.json` 은 표준 NestJS 초기화 형태로 작성
