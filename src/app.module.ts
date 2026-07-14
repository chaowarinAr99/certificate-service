import { Module } from '@nestjs/common';
import { HealthController } from './controllers/health.controller';
import { CertificatesController } from './controllers/certificates.controller';
import { CertificateService } from './services/certificate.service';
import { ExternalCertificateApiClient } from './clients/external-certificate-api.client';
import { APP_ENV, loadEnv } from './config/env';

@Module({
  controllers: [HealthController, CertificatesController],
  providers: [
    CertificateService,
    ExternalCertificateApiClient,
    {
      provide: APP_ENV,
      useFactory: loadEnv,
    },
  ],
})
export class AppModule {}
