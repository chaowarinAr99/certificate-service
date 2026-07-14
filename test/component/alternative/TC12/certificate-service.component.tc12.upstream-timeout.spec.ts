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
    it('TC12 returns 504 when upstream times out', async () => {
      nock('http://provider.test').post('/provider/certificates').delay(100).reply(200, {});

      await request(app.getHttpServer())
        .post('/certificates')
        .send({ refId: 'ENR001', learnerId: 'EMP001', courseRef: 'PHY001' })
        .expect(504)
        .expect({
          statusCode: 504,
          message: 'Certificate API request timed out',
        });
    });
  });
});
