import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateDoctorDto } from 'src/user/Dtos/Auth/authDto.dto';
export class UpdateDoctorDto extends PartialType(
  OmitType(CreateDoctorDto, ['password'] as const),
) {
  photo?: string;
}
