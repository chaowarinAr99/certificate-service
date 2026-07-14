import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  closeComponentTestApp,
  createComponentTestApp,
} from '../shared/component-test-app';

describe('Certificate Service component', () => {
  let app: INestApplication;

  beforeEach(async () => {
    app = await createComponentTestApp();
  });

  afterEach(async () => {
    await closeComponentTestApp(app);
  });

  describe('GET /health', () => {
    it('returns ok from GET /health', async () => {
      await request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect({ status: 'ok' });
    });
  });
});
