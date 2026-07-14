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
    it('TC03 returns issued certificate for ENR003', async () => {
      nock('http://provider.test')
        .post('/provider/certificates', {
          refId: 'ENR003',
          learnerId: 'EMP003',
          courseRef: 'COM001',
        })
        .reply(200, {
          certificate_id: 'CERT003',
          certificate_url: 'https://certificate.example.com/CERT003.pdf',
          status: 'issued',
          issued_at: '2026-05-15T10:00:00Z',
        });

      await request(app.getHttpServer())
        .post('/certificates')
        .send({
          refId: 'ENR003',
          learnerId: 'EMP003',
          courseRef: 'COM001',
        })
        .expect(200)
        .expect({
          certificate_id: 'CERT003',
          certificate_url: 'https://certificate.example.com/CERT003.pdf',
          status: 'issued',
          issued_at: '2026-05-15T10:00:00Z',
        });
    });
  });
});
