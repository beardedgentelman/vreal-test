import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateFileDto {
  @IsString()
  name: string;

  @IsString()
  dirPath: string;

  @IsOptional()
  @IsString()
  fileExtension?: string;

  @IsEnum(['unknown', 'directory', 'file'])
  type: 'unknown' | 'directory' | 'file';

  @IsBoolean()
  isPublic: boolean;
}
