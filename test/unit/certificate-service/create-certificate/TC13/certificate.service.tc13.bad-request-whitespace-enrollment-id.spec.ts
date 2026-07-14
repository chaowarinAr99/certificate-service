import { BadRequestError } from '../../../../../src/errors/certificate.errors';
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
    it('TC13 should throw BadRequestError when enrollmentId is whitespace', async () => {
      // Arrange
      const input = {
        enrollmentId: '   ',
        employeeId: 'EMP001',
        courseId: 'PHY001',
      };

      // Act
      const action = certificateService.createCertificate(input);

      // Assert
      await expect(action).rejects.toBeInstanceOf(BadRequestError);
      expect(certificateApiClient.generateCertificate).not.toHaveBeenCalled();
    });
  });
});
