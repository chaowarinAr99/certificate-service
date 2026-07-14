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
    it('TC17 returns 400 when learnerId is whitespace', async () => {
      await request(app.getHttpServer())
        .post('/certificates')
        .send({ refId: 'ENR001', learnerId: '   ', courseRef: 'PHY001' })
        .expect(400)
        .expect({
          statusCode: 400,
          message: 'employeeId is required',
        });
    });
  });
});
