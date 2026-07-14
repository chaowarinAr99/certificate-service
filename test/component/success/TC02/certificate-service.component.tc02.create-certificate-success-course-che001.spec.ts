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
    it('TC02 returns issued certificate for ENR002', async () => {
      nock('http://provider.test')
        .post('/provider/certificates', {
          refId: 'ENR002',
          learnerId: 'EMP002',
          courseRef: 'CHE001',
        })
        .reply(200, {
          certificate_id: 'CERT002',
          certificate_url: 'https://certificate.example.com/CERT002.pdf',
          status: 'issued',
          issued_at: '2026-05-15T10:00:00Z',
        });

      await request(app.getHttpServer())
        .post('/certificates')
        .send({
          refId: 'ENR002',
          learnerId: 'EMP002',
          courseRef: 'CHE001',
        })
        .expect(200)
        .expect({
          certificate_id: 'CERT002',
          certificate_url: 'https://certificate.example.com/CERT002.pdf',
          status: 'issued',
          issued_at: '2026-05-15T10:00:00Z',
        });
    });
  });
});
