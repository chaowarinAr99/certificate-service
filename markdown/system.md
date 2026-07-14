## Shared Context
We are splitting an existing learning project into two real microservice repos:
1) enrollment-service
2) certificate-service
## Goal:
- Make the system feel like real microservices.
- Use realistic testing practices.

## Responsibilities:
- generate certificates for approved enrollments
- call an external certificate API

## Business rules:
- only APPROVED enrollment can generate certificate
- progress must be 100
- external certificate API may succeed, fail, or timeout

## Testing:
- unit tests can mock the external API client
- component tests must use real MongoDB and seeded data
- Mountebank can be used to simulate the external certificate API
- integration tests should verify real HTTP + DB + external boundary behavior