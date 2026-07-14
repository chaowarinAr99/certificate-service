import { INestApplication } from '@nestjs/common';
import nock from 'nock';
import request from 'supertest';
import {
  closeComponentTestApp,
  createComponentTestApp,
} from '../../shared/component-test-app';

describe('Certificate Service component', () => {
  let app: INestApplication;

  beforeEach(async () => {
    app = await createComponentTestApp();
  });

  afterEach(async () => {
    await closeComponentTestApp(app);
  });

  describe('POST /certificates', () => {
    it('TC09 returns 502 when upstream response is missing certificate_url', async () => {
      nock('http://provider.test').post('/provider/certificates').reply(200, {
        certificate_id: 'CERT001',
        status: 'issued',
        issued_at: '2026-05-15T10:00:00Z',
      });

      await request(app.getHttpServer())
        .post('/certificates')
        .send({ refId: 'ENR001', learnerId: 'EMP001', courseRef: 'PHY001' })
        .expect(502)
        .expect({
          statusCode: 502,
          message: 'Upstream response has invalid certificate_url',
        });
    });
  });
});
