import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { CreateCertificateRequestDto } from '../dto/create-certificate-request.dto';
import { CertificateResponseDto } from '../dto/certificate-response.dto';
import { CertificateService } from '../services/certificate.service';

@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificateService: CertificateService) {}

  @Post()
  @HttpCode(200)
  async createCertificate(
    @Body() request: CreateCertificateRequestDto,
  ): Promise<CertificateResponseDto> {
    const result = await this.certificateService.createCertificate({
      enrollmentId: request.refId,
      employeeId: request.learnerId,
      courseId: request.courseRef,
    });

    return {
      certificate_id: result.certificateId,
      certificate_url: result.certificateUrl,
      status: 'issued',
      issued_at: result.issuedAt,
    };
  }
}
