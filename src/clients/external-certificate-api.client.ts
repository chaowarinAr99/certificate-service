import { Inject, Injectable } from '@nestjs/common';
import axios, { AxiosError, AxiosInstance } from 'axios';
import { APP_ENV, AppEnv } from '../config/env';
import { ExternalCertificateRequest } from '../services/certificate.service';

@Injectable()
export class ExternalCertificateApiClient {
  private readonly httpClient: AxiosInstance;

  constructor(@Inject(APP_ENV) private readonly env: AppEnv) {
    this.httpClient = axios.create({
      timeout: env.externalCertificateApiTimeoutMs,
      headers: env.externalCertificateApiKey
        ? { 'x-api-key': env.externalCertificateApiKey }
        : undefined,
    });
  }

  async generateCertificate(request: ExternalCertificateRequest): Promise<unknown> {
    try {
      const response = await this.httpClient.post(this.env.externalCertificateApiUrl, {
        refId: request.refId,
        learnerId: request.learnerId,
        courseRef: request.courseRef,
      });

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.code === 'ECONNABORTED') {
          const timeoutError = new Error('timeout');
          (timeoutError as Error & { code: string }).code = 'TIMEOUT';
          throw timeoutError;
        }

        throw error;
      }

      throw error;
    }
  }

  async createCertificate(request: ExternalCertificateRequest): Promise<unknown> {
    return this.generateCertificate(request);
  }
}
