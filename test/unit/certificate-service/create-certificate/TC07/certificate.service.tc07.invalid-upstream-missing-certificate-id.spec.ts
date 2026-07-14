import { InvalidCertificateResponseError } from '../../../../../src/errors/certificate.errors';
import { CertificateService } from '../../../../../src/services/certificate.service';

describe('CertificateService', () => {
  let certificateService: CertificateService;
  let certificateApiClient: {
    generateCertificate: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    certificateApiClient = {
      generateCertificate: jest.fn(),
    };
    certificateService = new CertificateService(certificateApiClient);
  });

  describe('createCertificate', () => {
    it('TC07 should throw InvalidCertificateResponseError when certificate_id is missing', async () => {
      // Arrange
      const input = {
        enrollmentId: 'ENR001',
        employeeId: 'EMP001',
        courseId: 'PHY001',
      };

      certificateApiClient.generateCertificate.mockResolvedValue({
        certificate_url: 'https://certificate.example.com/CERT001.pdf',
        status: 'issued',
        issued_at: '2026-05-15T10:00:00Z',
      });

      // Act
      const action = certificateService.createCertificate(input);

      // Assert
      await expect(action).rejects.toBeInstanceOf(InvalidCertificateResponseError);
    });
  });
});
