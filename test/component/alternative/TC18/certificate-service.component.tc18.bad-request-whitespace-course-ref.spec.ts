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
    it('TC18 returns 400 when courseRef is whitespace', async () => {
      await request(app.getHttpServer())
        .post('/certificates')
        .send({ refId: 'ENR001', learnerId: 'EMP001', courseRef: '   ' })
        .expect(400)
        .expect({
          statusCode: 400,
          message: 'courseId is required',
        });
    });
  });
});
