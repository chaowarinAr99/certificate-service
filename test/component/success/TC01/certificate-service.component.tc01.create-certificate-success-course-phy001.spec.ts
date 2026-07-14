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
    it('TC01 returns issued certificate', async () => {
      nock('http://provider.test')
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

      await request(app.getHttpServer())
        .post('/certificates')
        .send({
          refId: 'ENR001',
          learnerId: 'EMP001',
          courseRef: 'PHY001',
        })
        .expect(200)
        .expect({
          certificate_id: 'CERT001',
          certificate_url: 'https://certificate.example.com/CERT001.pdf',
          status: 'issued',
          issued_at: '2026-05-15T10:00:00Z',
        });
    });
  });
});
