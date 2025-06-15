import { IsString, MaxLength, IsOptional } from 'class-validator';

export class ImageDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  description: string;
}
