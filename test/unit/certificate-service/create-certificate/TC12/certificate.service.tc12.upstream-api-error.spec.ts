import { CertificateApiError } from '../../../../../src/errors/certificate.errors';
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
    it('TC12 should throw CertificateApiError when client throws generic error', async () => {
      // Arrange
      const input = {
        enrollmentId: 'ENR001',
        employeeId: 'EMP001',
        courseId: 'PHY001',
      };

      certificateApiClient.generateCertificate.mockRejectedValue(new Error('upstream failed'));

      // Act
      const action = certificateService.createCertificate(input);

      // Assert
      await expect(action).rejects.toBeInstanceOf(CertificateApiError);
    });
  });
});
