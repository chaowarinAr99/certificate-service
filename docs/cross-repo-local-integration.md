# Cross-Repo Local Integration

## Purpose

This guide explains how to verify that `enrollment-service` and `certificate-service` work together locally.

The flow uses:

- real `enrollment-service`
- real `certificate-service`
- fake external certificate provider via `Mountebank`

Docker is the default runtime path for cross-repo integration in this repo.

Do not run the Dockerized cross-repo stack at the same time as the Dockerized Bruno/API stack because both use the same host ports (`2525`, `5500`, and `4000`).

## Topology

```text
enrollment-service      http://localhost:3000
certificate-service     http://localhost:4000
fake external provider  http://localhost:5500
mb admin                http://localhost:2525
```

## Prerequisites

- both repos already ran `npm install`
- Docker is available for MongoDB used by `enrollment-service`
- `enrollment-service` app root exists at:
  - `/Users/chaowarin/Downloads/enrollment-service/enrollment-service`

## Required Config

`enrollment-service` must start with:

```bash
CERTIFICATE_API_URL=http://localhost:4000/certificates
```

`certificate-service` test runtime already starts with:

```bash
EXTERNAL_CERTIFICATE_API_URL=http://localhost:5500/provider/certificates
```

## Known Assumptions

- do not start `mb:start` from `enrollment-service` during this flow
- `POST /enrollments/:enrollmentId/approve` requires:

```json
{ "approvedBy": "HR001" }
```

- `POST /enrollments/:enrollmentId/certificate` requires:

```json
{ "progress": 100 }
```

- `POST /certificates` success contract is `200 OK`

## Local Fallback Manual Run

Terminal 1:

```bash
cd /Users/chaowarin/Downloads/certificate-service
npm run mb:start
npm run mb:load:success
```

Terminal 2:

```bash
cd /Users/chaowarin/Downloads/certificate-service
npm run start:api-test
```

Terminal 3:

```bash
cd /Users/chaowarin/Downloads/enrollment-service/enrollment-service
npm run mongo:start
CERTIFICATE_API_URL=http://localhost:4000/certificates npm run start
```

Then run:

```bash
curl -i http://localhost:4000/health
curl -i http://localhost:3000/health
curl -i -X POST http://localhost:3000/enrollments \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "EMP002",
    "courseId": "PHY001"
  }'
```

Set the returned enrollment id:

```bash
export ENROLLMENT_ID="PUT_REAL_ID_HERE"
```

```bash
curl -i -X PATCH "http://localhost:3000/enrollments/$ENROLLMENT_ID/approve" \
  -H "Content-Type: application/json" \
  -d '{
    "approvedBy": "HR001"
  }'

curl -i "http://localhost:3000/enrollments/$ENROLLMENT_ID"

curl -i -X POST "http://localhost:3000/enrollments/$ENROLLMENT_ID/certificate" \
  -H "Content-Type: application/json" \
  -d '{
    "progress": 100
  }'
```

## Automated Run

From `certificate-service`:

```bash
npm run test:cross-repo
```

This Docker default command runs the happy-path scenario aligned with enrollment-service Bruno `TC01`.

## Command Summary

### Smoke

```bash
npm run test:cross-repo
```

### Happy

```bash
npm run test:cross-repo:happy
npm run test:cross-repo:happy:phy001
npm run test:cross-repo:happy:che001
npm run test:cross-repo:happy:com001
```

### Alternative

```bash
npm run test:cross-repo:alternative
npm run test:cross-repo:alternative:missing-ref-id
npm run test:cross-repo:alternative:missing-learner-id
npm run test:cross-repo:alternative:missing-course-ref
npm run test:cross-repo:alternative:empty-ref-id
npm run test:cross-repo:alternative:empty-learner-id
npm run test:cross-repo:alternative:empty-course-ref
npm run test:cross-repo:alternative:whitespace-ref-id
npm run test:cross-repo:alternative:whitespace-learner-id
npm run test:cross-repo:alternative:whitespace-course-ref
npm run test:cross-repo:alternative:upstream-api-error
npm run test:cross-repo:alternative:invalid-upstream-missing-certificate-id
npm run test:cross-repo:alternative:invalid-upstream-missing-certificate-url
npm run test:cross-repo:alternative:invalid-upstream-missing-issued-at
npm run test:cross-repo:alternative:invalid-upstream-status
npm run test:cross-repo:alternative:upstream-timeout
```

Local fallback commands:

```bash
npm run test:cross-repo:local
npm run test:cross-repo:happy:local
npm run test:cross-repo:alternative:local
```

Additional happy-path scenarios aligned with enrollment-service Bruno success cases:

```bash
npm run test:cross-repo:happy:phy001
npm run test:cross-repo:happy:che001
npm run test:cross-repo:happy:com001
```

Alternative scenarios aligned with certificate-service Bruno cases:

```bash
npm run test:cross-repo:alternative:missing-ref-id
npm run test:cross-repo:alternative:missing-learner-id
npm run test:cross-repo:alternative:missing-course-ref
npm run test:cross-repo:alternative:empty-ref-id
npm run test:cross-repo:alternative:empty-learner-id
npm run test:cross-repo:alternative:empty-course-ref
npm run test:cross-repo:alternative:whitespace-ref-id
npm run test:cross-repo:alternative:whitespace-learner-id
npm run test:cross-repo:alternative:whitespace-course-ref
npm run test:cross-repo:alternative:upstream-api-error
npm run test:cross-repo:alternative:invalid-upstream-missing-certificate-id
npm run test:cross-repo:alternative:invalid-upstream-missing-certificate-url
npm run test:cross-repo:alternative:invalid-upstream-missing-issued-at
npm run test:cross-repo:alternative:invalid-upstream-status
npm run test:cross-repo:alternative:upstream-timeout
```

Note:

- happy scenarios are true cross-repo flows through `enrollment-service`
- request validation alternatives run against `certificate-service` directly because that behavior cannot be triggered through `enrollment-service`
- upstream-driven cross-repo scenarios assert the final `enrollment-service` response, so their final status/body can differ from direct `certificate-service` Bruno assertions

## Scenario Matrix

### Happy scenarios aligned with enrollment-service Bruno success

- `happy-phy001` -> `TC01_Create_Certificate_Success_course_PHY001`
- `happy-che001` -> `TC02_Create_Certificate_Success_course_CHE001`
- `happy-com001` -> `TC03_Create_Certificate_Success_course_COM001`

### Alternative scenarios aligned with certificate-service Bruno

- `missing-ref-id` -> `TC04_Create_Certificate_Bad_Request_Missing_RefId`
- `missing-learner-id` -> `TC05_Create_Certificate_Bad_Request_Missing_LearnerId`
- `missing-course-ref` -> `TC06_Create_Certificate_Bad_Request_Missing_CourseRef`
- `upstream-api-error` -> `TC07_Create_Certificate_Upstream_Api_Error`
- `invalid-upstream-missing-certificate-id` -> `TC08_Create_Certificate_Invalid_Upstream_Missing_Certificate_Id`
- `invalid-upstream-missing-certificate-url` -> `TC09_Create_Certificate_Invalid_Upstream_Missing_Certificate_Url`
- `invalid-upstream-missing-issued-at` -> `TC10_Create_Certificate_Invalid_Upstream_Missing_Issued_At`
- `invalid-upstream-status` -> `TC11_Create_Certificate_Invalid_Upstream_Status`
- `upstream-timeout` -> `TC12_Create_Certificate_Upstream_Timeout`
- `empty-ref-id` -> `TC13_Create_Certificate_Bad_Request_Empty_RefId`
- `empty-learner-id` -> `TC14_Create_Certificate_Bad_Request_Empty_LearnerId`
- `empty-course-ref` -> `TC15_Create_Certificate_Bad_Request_Empty_CourseRef`
- `whitespace-ref-id` -> `TC16_Create_Certificate_Bad_Request_Whitespace_RefId`
- `whitespace-learner-id` -> `TC17_Create_Certificate_Bad_Request_Whitespace_LearnerId`
- `whitespace-course-ref` -> `TC18_Create_Certificate_Bad_Request_Whitespace_CourseRef`

## Mongo Cleanup Behavior

The automated cross-repo script performs a full destructive reset before each run.

It does this by dropping the whole `enrollment_service` database:

```javascript
db.dropDatabase()
```

Then it starts `enrollment-service` with:

```text
MONGO_SEED_ON_START=true
```

This causes seed data to be recreated on startup.

Important notes:

- this is not a targeted cleanup
- this removes all data inside the `enrollment_service` database
- use this only for local integration test environments
- do not use this against a database that contains data you want to keep

## Configurable Enrollment Repo Path

The cross-repo runner uses this environment variable when you need to override the default local path:

```bash
ENROLLMENT_SERVICE_DIR=/path/to/enrollment-service/enrollment-service
```

Example:

```bash
ENROLLMENT_SERVICE_DIR=/path/to/enrollment-service/enrollment-service npm run test:cross-repo
```

## Troubleshooting

`400 approvedBy is required`

- approval request body is missing `approvedBy`

`409 Progress must be 100%`

- certificate generation request body is missing `progress: 100`

`502 CERTIFICATE_API_ERROR`

- `enrollment-service` reached the downstream call but `certificate-service` failed
- verify:
  - `http://localhost:4000/certificates` works directly
  - `CERTIFICATE_API_URL` points to `http://localhost:4000/certificates`
  - fake upstream is loaded and returns `200`
