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
    it('TC06 should throw BadRequestError when courseId is missing', async () => {
      // Arrange
      const input = {
        enrollmentId: 'ENR001',
        employeeId: 'EMP001',
        courseId: '',
      };

      // Act
      const action = certificateService.createCertificate(input);

      // Assert
      await expect(action).rejects.toBeInstanceOf(BadRequestError);
      expect(certificateApiClient.generateCertificate).not.toHaveBeenCalled();
    });
  });
});
