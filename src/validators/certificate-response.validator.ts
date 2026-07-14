import { InvalidCertificateResponseError } from '../errors/certificate.errors';
import { ExternalCertificateResponse } from '../services/certificate.service';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isIsoDateString(value: string): boolean {
  return !Number.isNaN(Date.parse(value));
}

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function validateCertificateResponse(
  payload: unknown,
): ExternalCertificateResponse {
  if (typeof payload !== 'object' || payload === null) {
    throw new InvalidCertificateResponseError(
      'Upstream service returned an invalid response body',
    );
  }

  const response = payload as Record<string, unknown>;

  if (!isNonEmptyString(response.certificate_id)) {
    throw new InvalidCertificateResponseError('Upstream response missing certificate_id');
  }

  if (!isNonEmptyString(response.certificate_url) || !isValidUrl(response.certificate_url)) {
    throw new InvalidCertificateResponseError('Upstream response has invalid certificate_url');
  }

  if (response.status !== 'issued') {
    throw new InvalidCertificateResponseError('Upstream response has invalid status');
  }

  if (!isNonEmptyString(response.issued_at) || !isIsoDateString(response.issued_at)) {
    throw new InvalidCertificateResponseError('Upstream response has invalid issued_at');
  }

  return {
    certificate_id: response.certificate_id,
    certificate_url: response.certificate_url,
    status: 'issued',
    issued_at: response.issued_at,
  };
}
