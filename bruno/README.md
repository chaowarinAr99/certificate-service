# Bruno Tests

## Purpose

This folder contains API contract and smoke tests for `certificate-service`.

These tests verify the public HTTP behavior of the service from the caller point of view.

## Scope

- uses `Bruno` to send HTTP requests
- uses `Mountebank` to fake the external certificate provider
- validates status codes, response shape, and error mapping
- does not test internal helper logic in isolation
- uses Docker as the default runtime path for API execution

## Structure

```text
bruno/
  certificate-service/
    environments/
      local.bru
      ci.bru
    health/
      Health_Check.bru
    certificates/
      success/
        TC01_Create_Certificate_Success_course_PHY001.bru
        TC02_Create_Certificate_Success_course_CHE001.bru
        TC03_Create_Certificate_Success_course_COM001.bru
      alternative/
        TC04_...
        ...
        TC18_...
```

## Run

Docker default commands:

```bash
npm run test:bruno
npm run test:bruno:success
npm run test:bruno:alternative
```

Local fallback examples:

```bash
npm run bru:run:health
npm run mb:load:success
npm run bru:run:success
```

Full CI-style suite:

```bash
npm run test:api:ci
```

## Guidelines

- `success/` contains happy-path scenarios
- `alternative/` contains bad request, invalid upstream, upstream error, and timeout scenarios
- keep 1 scenario per Bruno request file
- align scenario ids with the repo naming convention: `TCxx_...`

See root `README.md` for full service contract and runtime taxonomy.
