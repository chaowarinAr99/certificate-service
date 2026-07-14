# Unit Tests

## Purpose

This folder contains isolated tests for logic inside `certificate-service`.

Unit tests should be fast and focused. They validate business rules, mapping, validation, and error mapping without booting the whole app.

## Scope

- tests `CertificateService` behavior in isolation
- tests `ExternalCertificateApiClient` behavior in isolation
- tests response validator behavior in isolation
- allows mocking dependencies
- does not test Nest app wiring or HTTP routing

## Structure

```text
test/unit/
  certificate-service/
    create-certificate/
      TC01/
        certificate.service.tc01.create-certificate-success-course-phy001.spec.ts
      ...
      TC13/
  certificate-response.validator.spec.ts
  external-certificate-api.client.spec.ts
```

## Run

Run all unit tests:

```bash
npm run test:unit
```

Run only `CertificateService` unit tests:

```bash
npm test -- test/unit/certificate-service/create-certificate
```

## Guidelines

- keep 1 scenario per test file when following the `TCxx` structure
- mock only the dependency being called
- do not mock the subject under test
- focus on validation, mapping, and error behavior

See root `README.md` for the overall project and test layer summary.
