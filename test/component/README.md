# Component Tests

## Purpose

This folder contains app-level component tests for `certificate-service`.

These tests exercise the HTTP layer, controller, service, client wiring, validation, and error mapping using the real Nest app.

## Scope

- uses the real `AppModule`
- uses real controller, service, client, validation, and error filter
- uses `supertest` to call the app over HTTP
- uses `nock` to fake the external certificate provider
- does not call the real upstream provider

## Structure

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
  health/
    health-check.spec.ts
```

## Run

```bash
npm run test:component
```

## Guidelines

- `success/` contains happy-path datasets
- `alternative/` contains validation, invalid upstream response, upstream error, and timeout scenarios
- `health/` contains the health endpoint scenario
- keep 1 scenario per file
- keep assertions focused on HTTP status, response body, and real wiring behavior

Difference from Bruno:

- component tests are Jest-based app wiring tests
- Bruno tests are API contract and smoke tests

See root `README.md` for the full test strategy and commands.
