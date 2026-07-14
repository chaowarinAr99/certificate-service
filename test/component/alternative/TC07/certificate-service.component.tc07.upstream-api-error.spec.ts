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
    it('TC07 returns 502 when upstream returns non-2xx', async () => {
      nock('http://provider.test').post('/provider/certificates').reply(500, { error: 'boom' });

      await request(app.getHttpServer())
        .post('/certificates')
        .send({ refId: 'ENR001', learnerId: 'EMP001', courseRef: 'PHY001' })
        .expect(502)
        .expect({
          statusCode: 502,
          message: 'Certificate API request failed',
        });
    });
  });
});
