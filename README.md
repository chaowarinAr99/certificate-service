# certificate-service

Internal NestJS service that accepts certificate requests from `enrollment-service`, validates them, calls `external-certificate-api`, validates the upstream response, maps upstream errors, and returns the contract expected by the caller.

## Quick Start สำหรับคนที่เพิ่งเข้ามาใหม่

### สิ่งที่ต้องมี

ก่อนเริ่มใช้งาน repo นี้ ควรมี:

- Node.js `22`
- npm
- Docker

### 1. ติดตั้ง dependencies

```bash
npm install
```

### 2. เลือกสิ่งที่ต้องการรัน

#### รัน service อย่างเดียว

ใช้กรณีที่ต้องการเปิด `certificate-service` เพื่อทดลอง endpoint หรือพัฒนา feature

```bash
npm run start:dev
```

service จะเปิดที่:

```text
http://localhost:4000
```

เช็ก health:

```bash
curl -i http://localhost:4000/health
```

#### รัน unit tests

ใช้เมื่อต้องการเช็ก logic แบบเร็วที่สุดในระดับ isolated test

```bash
npm run test:unit
```

#### รัน component tests

ใช้เมื่อต้องการเช็กการทำงานจริงของ app wiring ภายใน repo นี้ เช่น:

- HTTP layer
- controller
- service
- client
- validation
- error mapping

```bash
npm run test:component
```

#### รัน API tests ด้วย Docker

นี่คือเส้นทาง default สำหรับ Bruno/API tests

```bash
npm run test:bruno
```

รันเฉพาะ success scenarios:

```bash
npm run test:bruno:success
```

รันเฉพาะ alternative scenarios:

```bash
npm run test:bruno:alternative
```

สิ่งที่ path นี้ใช้:

- container ของ `certificate-service`
- container ของ `Mountebank` สำหรับปลอม upstream

#### รัน cross-repo integration ด้วย Docker

นี่คือเส้นทาง default สำหรับทดสอบการทำงานร่วมกันระหว่าง:

- `enrollment-service`
- `certificate-service`

รันแบบ quick smoke:

```bash
npm run test:cross-repo
```

รัน happy scenarios:

```bash
npm run test:cross-repo:happy
```

รัน alternative scenarios:

```bash
npm run test:cross-repo:alternative
```

ข้อสำคัญ:

- ต้องมี repo `enrollment-service` อยู่ในเครื่องด้วย
- ถ้า path ของ repo ไม่ตรงกับค่า default ให้ตั้ง:

```bash
ENROLLMENT_SERVICE_DIR=/path/to/enrollment-service/enrollment-service
```

ตัวอย่าง:

```bash
ENROLLMENT_SERVICE_DIR=/path/to/enrollment-service/enrollment-service npm run test:cross-repo
```

### 3. เส้นทาง fallback แบบ local

ถ้าต้องการ debug โดยไม่ใช้ Docker ยังมี fallback commands ให้ใช้

API fallback:

```bash
npm run test:api:local
```

Cross-repo fallback:

```bash
npm run test:cross-repo:local
```

คำสั่งเหล่านี้มีไว้สำหรับ debug เป็นหลัก โดยปกติให้ใช้ Docker path ก่อน

### 4. พอร์ตที่ใช้บ่อย

พอร์ตหลักที่ใช้ใน repo นี้มีดังนี้:

```text
4000 = certificate-service
2525 = Mountebank admin
5500 = fake upstream provider
```

ถ้ารัน cross-repo จะใช้เพิ่ม:

```text
3000 = enrollment-service
27018 = Mongo host mapping
```

ข้อควรระวัง:

- อย่ารัน Dockerized API tests และ Dockerized cross-repo tests พร้อมกัน
- เพราะมีการใช้พอร์ตบางตัวร่วมกัน

### 5. ถ้ารันแล้วมีปัญหา

ให้เริ่มเช็กจากจุดเหล่านี้ก่อน:

- `http://localhost:4000/health`
- Docker เปิดอยู่หรือไม่
- มี port conflict หรือไม่
- ถ้าเป็น cross-repo ให้เช็กว่า `ENROLLMENT_SERVICE_DIR` ถูกต้องหรือไม่

ถ้าต้องการคู่มือเชิงลึกเพิ่มเติม ให้ดูที่:

```text
docs/cross-repo-local-integration.md
```

## Quality Summary

This repo now has four test layers in place:

- `unit` for isolated logic and mapping
- `component` for app wiring and HTTP behavior
- `api` for Bruno + Mountebank contract and smoke coverage
- `cross-repo` for `enrollment-service -> certificate-service` integration flows

Default runtime policy:

- `unit` and `component` stay host-based
- `Bruno/API` uses Docker as the default path
- `cross-repo` uses Docker as the default path
- local process orchestration remains available as fallback/debug only

CI coverage now includes:

- main repo build and Jest tests
- Bruno API suite
- cross-repo smoke
- grouped cross-repo happy scenarios
- grouped cross-repo alternative scenarios

Cross-repo CI jobs are now wired through a reusable GitHub Actions workflow so the shared setup for checkout, install, and environment wiring stays in one place.

## Endpoints

### `GET /health`

Response:

```json
{
  "status": "ok"
}
```

### `POST /certificates`

Success status: `200 OK`

Inbound request contract:

```json
{
  "refId": "ENR001",
  "learnerId": "EMP001",
  "courseRef": "PHY001"
}
```

Success response contract:

```json
{
  "certificate_id": "CERT001",
  "certificate_url": "https://certificate.example.com/CERT001.pdf",
  "status": "issued",
  "issued_at": "2026-05-15T10:00:00Z"
}
```

Validation rules:

- `refId` is required and must be a non-empty string
- `learnerId` is required and must be a non-empty string
- `courseRef` is required and must be a non-empty string

Error mapping:

- invalid or incomplete request body returns `400`
- upstream non-2xx returns `502`
- upstream success body with invalid shape returns `502`
- upstream timeout returns `504`

## Upstream API

Outbound request sent to `external-certificate-api`:

`POST /provider/certificates`

```json
{
  "refId": "ENR001",
  "learnerId": "EMP001",
  "courseRef": "PHY001"
}
```

Expected upstream success response:

```json
{
  "certificate_id": "CERT001",
  "certificate_url": "https://certificate.example.com/CERT001.pdf",
  "status": "issued",
  "issued_at": "2026-05-15T10:00:00Z"
}
```

## Environment

Copy `.env.example` to `.env` and set:

```dotenv
PORT=4000
EXTERNAL_CERTIFICATE_API_URL=http://localhost:5000/provider/certificates
EXTERNAL_CERTIFICATE_API_TIMEOUT_MS=3000
EXTERNAL_CERTIFICATE_API_KEY=
```

`EXTERNAL_CERTIFICATE_API_KEY` is optional. When present it is sent as `x-api-key`.

## Run

```bash
npm install
npm run start:dev
```

## Test

```bash
npm test
```

Available test commands:

- `npm run test:unit`
- `npm run test:component`
- `npm run test:cross-repo`
- `npm run test:bruno`

### Command Matrix

| Goal | Primary command | Notes |
| --- | --- | --- |
| Run isolated logic tests | `npm run test:unit` | Fastest feedback for service/client/validator logic |
| Run app wiring tests | `npm run test:component` | Real Nest app with fake upstream |
| Run Bruno/API smoke locally with Docker | `npm run test:bruno` | Docker default path |
| Run Bruno/API success scenarios only | `npm run test:bruno:success` | Docker default path |
| Run Bruno/API alternative scenarios only | `npm run test:bruno:alternative` | Docker default path |
| Run cross-repo smoke with enrollment-service | `npm run test:cross-repo` | Docker default path |
| Run cross-repo happy scenarios | `npm run test:cross-repo:happy` | Docker default path |
| Run cross-repo alternative scenarios | `npm run test:cross-repo:alternative` | Docker default path |
| Use host-process Bruno fallback | `npm run test:api:local` | Fallback/debug only |
| Use host-process cross-repo fallback | `npm run test:cross-repo:local` | Fallback/debug only |

## API Tests

This repo includes API contract tests using `Bruno` and upstream stubs using `Mountebank`.

Docker is the default runtime path for Bruno/API commands.

Do not run the Dockerized Bruno/API stack and the Dockerized cross-repo stack at the same time. They both bind the same host ports (`2525`, `5500`, and `4000`).

### Files

- `bruno/certificate-service` Bruno collection
- `mountebank/imposters` upstream stub scenarios
- `scripts/mountebank` helper scripts to reset/load imposters
- `scripts/api-tests/run-bruno-suite.js` headless smoke runner for CI-style execution

Bruno certificate scenarios are grouped under:

```text
bruno/certificate-service/certificates/
  success/
    TC01_Create_Certificate_Success_course_PHY001.bru
    TC02_Create_Certificate_Success_course_CHE001.bru
    TC03_Create_Certificate_Success_course_COM001.bru
  alternative/
    TC04_Create_Certificate_Bad_Request_Missing_RefId.bru
    TC05_Create_Certificate_Bad_Request_Missing_LearnerId.bru
    ...
    TC18_Create_Certificate_Bad_Request_Whitespace_CourseRef.bru
```

### Install test tooling

```bash
npm install
```

### Default Docker commands

```bash
npm run test:bruno
npm run test:bruno:success
npm run test:bruno:alternative
```

Compatibility aliases:

```bash
npm run test:api:ci
npm run test:api:docker
```

Use `test:bruno*` as the primary command set. The `test:api:*` commands are kept as compatibility aliases.

Local fallback commands:

```bash
npm run test:api:local
npm run test:api:success:local
npm run test:api:alternative:local
```

Low-level manual helpers still exist for debugging only:

- `npm run mb:start`
- `npm run mb:load:*`
- `npm run bru:run:*`
- `npm run start:api-test`

These are not the default path for normal API execution anymore.

### Local fallback manual run

Terminal 1: start Mountebank

```bash
npm run mb:start
```

Terminal 2: start the service against the local stub

```bash
npm run start:api-test
```

This test-only script points the service to `http://localhost:5500/provider/certificates` to avoid conflicts with anything already using port `5000` on your machine.

Terminal 3: load an imposter and run a Bruno folder

Health check does not need an imposter:

```bash
npm run bru:run:health
```

Success scenario:

```bash
npm run mb:load:success
npm run bru:run:success
```

Additional success datasets:

```bash
npm run test:bruno:success
```

This Docker default command runs all three success datasets:

- `TC01_Create_Certificate_Success_course_PHY001`
- `TC02_Create_Certificate_Success_course_CHE001`
- `TC03_Create_Certificate_Success_course_COM001`

Validation scenarios mapped to `400`:

```bash
npm run bru:run:missing-ref-id
npm run bru:run:missing-learner-id
npm run bru:run:missing-course-ref
npm run bru:run:empty-ref-id
npm run bru:run:empty-learner-id
npm run bru:run:empty-course-ref
npm run bru:run:whitespace-ref-id
npm run bru:run:whitespace-learner-id
npm run bru:run:whitespace-course-ref
```

Invalid upstream body mapped to `502`:

```bash
npm run mb:load:missing-certificate-id
npm run bru:run:missing-certificate-id

npm run mb:load:missing-certificate-url
npm run bru:run:missing-certificate-url

npm run mb:load:missing-issued-at
npm run bru:run:missing-issued-at

npm run mb:load:invalid-status
npm run bru:run:invalid-status
```

Upstream non-2xx mapped to `502`:

```bash
npm run mb:load:non-2xx
npm run bru:run:non-2xx
```

Upstream timeout mapped to `504`:

```bash
npm run mb:load:timeout
npm run bru:run:timeout
```

When finished:

```bash
npm run mb:stop
```

### CI-style headless run

Run the Dockerized API suite end-to-end:

```bash
npm run test:api:ci
```

This script will:

- start Mountebank on `2525`
- start `certificate-service` on `4000`
- load each imposter scenario automatically
- run Bruno smoke folders with the CI environment file

### Current Bruno smoke coverage

- `Health_Check` `GET /health`
- `TC01` `POST /certificates` success `PHY001`
- `TC02` `POST /certificates` success `CHE001`
- `TC03` `POST /certificates` success `COM001`
- `TC04` missing `refId` mapped to `400`
- `TC05` missing `learnerId` mapped to `400`
- `TC06` missing `courseRef` mapped to `400`
- `TC07` upstream non-2xx mapped to `502`
- `TC08` upstream missing `certificate_id` mapped to `502`
- `TC09` upstream missing `certificate_url` mapped to `502`
- `TC10` upstream missing `issued_at` mapped to `502`
- `TC11` upstream invalid `status` mapped to `502`
- `TC12` upstream timeout mapped to `504`
- `TC13` empty `refId` mapped to `400`
- `TC14` empty `learnerId` mapped to `400`
- `TC15` empty `courseRef` mapped to `400`
- `TC16` whitespace `refId` mapped to `400`
- `TC17` whitespace `learnerId` mapped to `400`
- `TC18` whitespace `courseRef` mapped to `400`

## Test Layers

- `test/unit` isolated logic tests
- `test/component` app wiring + HTTP layer + fake upstream tests
- `bruno/certificate-service` API contract and smoke tests via Bruno + Mountebank

Default commands:

- `npm run test:bruno`
- `npm run test:cross-repo`

## Cross-Repo Integration

Cross-repo local integration between `enrollment-service` and `certificate-service` is documented in:

```text
docs/cross-repo-local-integration.md
```

Docker default happy-path smoke command:

```bash
npm run test:cross-repo
```

Do not run `test:cross-repo*` at the same time as `test:bruno*` because both Docker stacks bind the same host ports.

Grouped commands:

```bash
npm run test:cross-repo:happy
npm run test:cross-repo:alternative
```

Compatibility aliases:

```bash
npm run test:cross-repo:local
npm run test:cross-repo:happy:local
npm run test:cross-repo:alternative:local
```

Use the Docker-default commands first. The `:local` variants are fallback/debug paths only.

Recommended usage:

- `npm run test:cross-repo` for a quick happy-path smoke check
- `npm run test:cross-repo:happy` for happy-path regression across all supported success datasets
- `npm run test:cross-repo:alternative` for broader regression of error, validation, and upstream failure scenarios

Local fallback commands:

```bash
npm run test:cross-repo:local
npm run test:cross-repo:happy:local
npm run test:cross-repo:alternative:local
```

Full scenario matrix and execution details:

```text
docs/cross-repo-local-integration.md
```

### Component Test Structure

Component tests are organized by scenario type and test case id:

```text
test/component/
  shared/
    component-test-app.ts
  success/
    TC01/
      certificate-service.component.tc01.create-certificate-success-course-phy001.spec.ts
    TC02/
      certificate-service.component.tc02.create-certificate-success-course-che001.spec.ts
    TC03/
      certificate-service.component.tc03.create-certificate-success-course-com001.spec.ts
  alternative/
    TC04/
      certificate-service.component.tc04.bad-request-missing-ref-id.spec.ts
    ...
    TC18/
      certificate-service.component.tc18.bad-request-whitespace-course-ref.spec.ts
  health/
    health-check.spec.ts
```

Current component test numbering:

- `TC01-TC03` success `POST /certificates`
- `TC04-TC06` missing field alternatives
- `TC07-TC12` upstream and invalid upstream alternatives
- `TC13-TC18` empty and whitespace alternatives
- `health/health-check.spec.ts` for `GET /health`

Example paths:

- `TC01`: `test/component/success/TC01/certificate-service.component.tc01.create-certificate-success-course-phy001.spec.ts`
- `TC15`: `test/component/alternative/TC15/certificate-service.component.tc15.bad-request-empty-course-ref.spec.ts`

## Structure

- `src/controllers` inbound HTTP endpoints
- `src/services` orchestration logic
- `src/clients` external API client
- `src/validators` upstream response validation
- `src/middleware` global error mapping
- `test/unit` focused logic tests
- `test/component` app-level component tests
