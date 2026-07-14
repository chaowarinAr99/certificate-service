import { CertificateApiTimeoutError } from '../../../../../src/errors/certificate.errors';
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
    it('TC11 should throw CertificateApiTimeoutError when client throws timeout error', async () => {
      // Arrange
      const input = {
        enrollmentId: 'ENR001',
        employeeId: 'EMP001',
        courseId: 'PHY001',
      };

      const timeoutError = Object.assign(new Error('timeout'), { code: 'TIMEOUT' });
      certificateApiClient.generateCertificate.mockRejectedValue(timeoutError);

      // Act
      const action = certificateService.createCertificate(input);

      // Assert
      await expect(action).rejects.toBeInstanceOf(CertificateApiTimeoutError);
    });
  });
});
