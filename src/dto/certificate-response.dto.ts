export class CertificateResponseDto {
  certificate_id!: string;
  certificate_url!: string;
  status!: 'issued';
  issued_at!: string;
}
