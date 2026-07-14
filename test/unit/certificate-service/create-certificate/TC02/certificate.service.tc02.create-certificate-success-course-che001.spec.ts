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
    it('TC02 should create certificate successfully for ENR002', async () => {
      // Arrange
      const input = {
        enrollmentId: 'ENR002',
        employeeId: 'EMP002',
        courseId: 'CHE001',
      };

      certificateApiClient.generateCertificate.mockResolvedValue({
        certificate_id: 'CERT002',
        certificate_url: 'https://certificate.example.com/CERT002.pdf',
        status: 'issued',
        issued_at: '2026-05-15T10:00:00Z',
      });

      // Act
      const result = await certificateService.createCertificate(input);

      // Assert
      expect(certificateApiClient.generateCertificate).toHaveBeenCalledTimes(1);
      expect(certificateApiClient.generateCertificate).toHaveBeenCalledWith({
        refId: 'ENR002',
        learnerId: 'EMP002',
        courseRef: 'CHE001',
      });
      expect(result).toEqual({
        certificateId: 'CERT002',
        certificateUrl: 'https://certificate.example.com/CERT002.pdf',
        issuedAt: '2026-05-15T10:00:00Z',
      });
    });
  });
});
