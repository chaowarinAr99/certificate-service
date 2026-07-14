import { validateCertificateResponse } from '../../src/validators/certificate-response.validator';
import { InvalidCertificateResponseError } from '../../src/errors/certificate.errors';

describe('validateCertificateResponse', () => {
  it('accepts a valid response body', () => {
    expect(
      validateCertificateResponse({
        certificate_id: 'CERT001',
        certificate_url: 'https://certificate.example.com/CERT001.pdf',
        status: 'issued',
        issued_at: '2026-05-15T10:00:00Z',
      }),
    ).toEqual({
      certificate_id: 'CERT001',
      certificate_url: 'https://certificate.example.com/CERT001.pdf',
      status: 'issued',
      issued_at: '2026-05-15T10:00:00Z',
    });
  });

  it('rejects a non-issued status', () => {
    expect(() =>
      validateCertificateResponse({
        certificate_id: 'CERT001',
        certificate_url: 'https://certificate.example.com/CERT001.pdf',
        status: 'pending',
        issued_at: '2026-05-15T10:00:00Z',
      }),
    ).toThrow(InvalidCertificateResponseError);
  });
});
