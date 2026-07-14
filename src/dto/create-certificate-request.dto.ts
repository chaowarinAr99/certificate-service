import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCertificateRequestDto {
  @IsString()
  @IsNotEmpty()
  refId!: string;

  @IsString()
  @IsNotEmpty()
  learnerId!: string;

  @IsString()
  @IsNotEmpty()
  courseRef!: string;
}
