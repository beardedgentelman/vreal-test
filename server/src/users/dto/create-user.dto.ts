import { IsEmail, IsOptional, IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'First name of the user',
    example: 'John',
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'Last name of the user',
    example: 'Doe',
  })
  @IsString()
  lastName: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'john.doe@example.com',
  })
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Profile picture URL of the user (optional)',
    example: 'https://example.com/profile.jpg',
    required: false,
  })
  @IsString()
  @IsUrl()
  @IsOptional()
  picture?: string;

  @ApiProperty({
    description: 'Password for the user',
    example: 'StrongP@ssword123',
  })
  @IsString()
  password: string;
}
