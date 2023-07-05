import { IsEmail, IsString, IsNotEmpty, MinLength, MaxLength, IsIn } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  public email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(9)
  @MaxLength(32)
  public password: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(['user', 'admin', 'support'])
  public role: string;
}

export class UpdateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(9)
  @MaxLength(32)
  public password: string;
}
