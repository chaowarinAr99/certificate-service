export const APP_ENV = Symbol('APP_ENV');

export interface AppEnv {
  port: number;
  externalCertificateApiUrl: string;
  externalCertificateApiTimeoutMs: number;
  externalCertificateApiKey?: string;
}

function parseInteger(value: string | undefined, fallback: number, name: string): number {
  if (value === undefined || value === '') {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }

  return parsed;
}

export function loadEnv(env: NodeJS.ProcessEnv = process.env): AppEnv {
  const externalCertificateApiUrl = env.EXTERNAL_CERTIFICATE_API_URL;
  if (!externalCertificateApiUrl) {
    throw new Error('EXTERNAL_CERTIFICATE_API_URL is required');
  }

  return {
    port: parseInteger(env.PORT, 4000, 'PORT'),
    externalCertificateApiUrl,
    externalCertificateApiTimeoutMs: parseInteger(
      env.EXTERNAL_CERTIFICATE_API_TIMEOUT_MS,
      3000,
      'EXTERNAL_CERTIFICATE_API_TIMEOUT_MS',
    ),
    externalCertificateApiKey: env.EXTERNAL_CERTIFICATE_API_KEY || undefined,
  };
}
