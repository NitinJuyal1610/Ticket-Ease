import { IsNotEmpty, MaxLength, MinLength, IsString, IsIn } from 'class-validator';

export class CreateTicketDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  public title: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  @MaxLength(1024)
  public description: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(['low', 'medium', 'high'])
  public priority: string;
}
