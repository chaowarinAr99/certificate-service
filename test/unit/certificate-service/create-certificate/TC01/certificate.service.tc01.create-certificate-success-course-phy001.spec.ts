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
    it('TC01 should create certificate successfully for ENR001', async () => {
      // Arrange
      const input = {
        enrollmentId: 'ENR001',
        employeeId: 'EMP001',
        courseId: 'PHY001',
      };

      certificateApiClient.generateCertificate.mockResolvedValue({
        certificate_id: 'CERT001',
        certificate_url: 'https://certificate.example.com/CERT001.pdf',
        status: 'issued',
        issued_at: '2026-05-15T10:00:00Z',
      });

      // Act
      const result = await certificateService.createCertificate(input);

      // Assert
      expect(certificateApiClient.generateCertificate).toHaveBeenCalledTimes(1);
      expect(certificateApiClient.generateCertificate).toHaveBeenCalledWith({
        refId: 'ENR001',
        learnerId: 'EMP001',
        courseRef: 'PHY001',
      });
      expect(result).toEqual({
        certificateId: 'CERT001',
        certificateUrl: 'https://certificate.example.com/CERT001.pdf',
        issuedAt: '2026-05-15T10:00:00Z',
      });
    });
  });
});
