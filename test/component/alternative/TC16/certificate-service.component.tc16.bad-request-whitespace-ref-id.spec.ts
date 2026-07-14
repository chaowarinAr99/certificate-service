import { INestApplication } from '@nestjs/common';
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
    it('TC16 returns 400 when refId is whitespace', async () => {
      await request(app.getHttpServer())
        .post('/certificates')
        .send({ refId: '   ', learnerId: 'EMP001', courseRef: 'PHY001' })
        .expect(400)
        .expect({
          statusCode: 400,
          message: 'enrollmentId is required',
        });
    });
  });
});
