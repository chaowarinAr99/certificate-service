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
    it('TC10 should preserve InvalidCertificateResponseError when upstream status is not issued', async () => {
      // Arrange
      const input = {
        enrollmentId: 'ENR001',
        employeeId: 'EMP001',
        courseId: 'PHY001',
      };

      certificateApiClient.generateCertificate.mockResolvedValue({
        certificate_id: 'CERT001',
        certificate_url: 'https://certificate.example.com/CERT001.pdf',
        status: 'failed',
        issued_at: '2026-05-15T10:00:00Z',
      });

      // Act
      const action = certificateService.createCertificate(input);

      // Assert
      await expect(action).rejects.toBeInstanceOf(InvalidCertificateResponseError);
      await expect(action).rejects.toThrow('Upstream response has invalid status');
    });
  });
});
