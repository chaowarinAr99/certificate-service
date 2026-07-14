import nock from 'nock';
import { ExternalCertificateApiClient } from '../../src/clients/external-certificate-api.client';
import { AppEnv } from '../../src/config/env';
import { UpstreamBadGatewayError, UpstreamTimeoutError } from '../../src/errors/upstream.errors';

describe('ExternalCertificateApiClient', () => {
  const env: AppEnv = {
    port: 4000,
    externalCertificateApiUrl: 'http://provider.test/provider/certificates',
    externalCertificateApiTimeoutMs: 50,
  };

  afterEach(() => {
    nock.cleanAll();
  });

  it('posts request payload to upstream', async () => {
    const scope = nock('http://provider.test')
      .post('/provider/certificates', {
        refId: 'ENR001',
        learnerId: 'EMP001',
        courseRef: 'PHY001',
      })
      .reply(200, {
        certificate_id: 'CERT001',
        certificate_url: 'https://certificate.example.com/CERT001.pdf',
        status: 'issued',
        issued_at: '2026-05-15T10:00:00Z',
      });

    const client = new ExternalCertificateApiClient(env);

    await expect(
      client.generateCertificate({
        refId: 'ENR001',
        learnerId: 'EMP001',
        courseRef: 'PHY001',
      }),
    ).resolves.toEqual({
      certificate_id: 'CERT001',
      certificate_url: 'https://certificate.example.com/CERT001.pdf',
      status: 'issued',
      issued_at: '2026-05-15T10:00:00Z',
    });

    expect(scope.isDone()).toBe(true);
  });

  it('maps non-2xx upstream response to bad gateway', async () => {
    nock('http://provider.test').post('/provider/certificates').reply(500, { error: 'boom' });

    const client = new ExternalCertificateApiClient(env);

    await expect(
      client.generateCertificate({
        refId: 'ENR001',
        learnerId: 'EMP001',
        courseRef: 'PHY001',
      }),
    ).rejects.toBeInstanceOf(Error);
  });

  it('maps timeout to gateway timeout', async () => {
    nock('http://provider.test').post('/provider/certificates').delay(100).reply(200, {});

    const client = new ExternalCertificateApiClient(env);

    await expect(
      client.generateCertificate({
        refId: 'ENR001',
        learnerId: 'EMP001',
        courseRef: 'PHY001',
      }),
    ).rejects.toMatchObject({ code: 'TIMEOUT' });
  });
});
