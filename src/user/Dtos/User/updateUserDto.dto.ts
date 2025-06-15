import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from 'src/user/Dtos/Auth/authDto.dto';
export class UpdateUserDto extends  PartialType (OmitType(CreateUserDto, [
  'password',
] as const) ){
  photo?: string;
}
