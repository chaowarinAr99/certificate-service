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
    it('TC14 returns 400 when learnerId is empty string', async () => {
      const response = await request(app.getHttpServer())
        .post('/certificates')
        .send({ refId: 'ENR001', learnerId: '', courseRef: 'PHY001' })
        .expect(400);

      expect(response.body.statusCode).toBe(400);
      expect(response.body.message).toContain('learnerId should not be empty');
    });
  });
});
