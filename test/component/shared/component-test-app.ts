import 'reflect-metadata';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import nock from 'nock';
import { AppModule } from '../../../src/app.module';
import { HttpExceptionFilter } from '../../../src/middleware/error-handler';

export async function createComponentTestApp(): Promise<INestApplication> {
  process.env.PORT = '4000';
  process.env.EXTERNAL_CERTIFICATE_API_URL =
    'http://provider.test/provider/certificates';
  process.env.EXTERNAL_CERTIFICATE_API_TIMEOUT_MS = '50';
  delete process.env.EXTERNAL_CERTIFICATE_API_KEY;

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.init();

  return app;
}

export async function closeComponentTestApp(app: INestApplication): Promise<void> {
  nock.cleanAll();
  await app.close();
}
