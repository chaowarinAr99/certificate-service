import { Inject, Injectable } from '@nestjs/common';
import { ExternalCertificateApiClient } from '../clients/external-certificate-api.client';
import {
  BadRequestError,
  CertificateApiError,
  CertificateApiTimeoutError,
  InvalidCertificateResponseError,
} from '../errors/certificate.errors';
import { validateCertificateResponse } from '../validators/certificate-response.validator';

export type CreateCertificateInput = {
  enrollmentId: string;
  employeeId: string;
  courseId: string;
};

export type CreateCertificateResult = {
  certificateId: string;
  certificateUrl: string;
  issuedAt: string;
};

export type ExternalCertificateRequest = {
  refId: string;
  learnerId: string;
  courseRef: string;
};

export type ExternalCertificateResponse = {
  certificate_id: string;
  certificate_url: string;
  status: 'issued' | 'failed';
  issued_at: string;
};

export type CertificateApiClient = {
  generateCertificate(
    payload: ExternalCertificateRequest,
  ): Promise<ExternalCertificateResponse>;
};

@Injectable()
export class CertificateService {
  constructor(
    @Inject(ExternalCertificateApiClient)
    private readonly externalCertificateApiClient: CertificateApiClient,
  ) {}

  async createCertificate(request: CreateCertificateInput): Promise<CreateCertificateResult> {
    this.validateInput(request);

    try {
      const response = await this.externalCertificateApiClient.generateCertificate(
        this.mapRequest(request),
      );
      const validatedResponse = validateCertificateResponse(response);

      return {
        certificateId: validatedResponse.certificate_id,
        certificateUrl: validatedResponse.certificate_url,
        issuedAt: validatedResponse.issued_at,
      };
    } catch (error) {
      if (error instanceof InvalidCertificateResponseError) {
        throw error;
      }

      if (this.isTimeoutError(error)) {
        throw new CertificateApiTimeoutError();
      }

      throw new CertificateApiError();
    }
  }

  private validateInput(request: CreateCertificateInput): void {
    if (!this.isNonEmptyString(request.enrollmentId)) {
      throw new BadRequestError('enrollmentId is required');
    }

    if (!this.isNonEmptyString(request.employeeId)) {
      throw new BadRequestError('employeeId is required');
    }

    if (!this.isNonEmptyString(request.courseId)) {
      throw new BadRequestError('courseId is required');
    }
  }

  private mapRequest(request: CreateCertificateInput): ExternalCertificateRequest {
    return {
      refId: request.enrollmentId,
      learnerId: request.employeeId,
      courseRef: request.courseId,
    };
  }

  private isNonEmptyString(value: string | undefined): value is string {
    return typeof value === 'string' && value.trim().length > 0;
  }

  private isTimeoutError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: unknown }).code === 'TIMEOUT'
    );
  }
}
