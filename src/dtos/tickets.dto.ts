import { IsNotEmpty, MaxLength, MinLength, IsString, IsIn } from 'class-validator';

const categories = [
  'Login/Authentication Issue',
  'UI/UX Feedback',
  'Performance Problem',
  'Broken Links',
  'Error Messages',
  'Compatibility Issue',
  'Missing or Incorrect Data',
  'Feature Malfunction',
  'Spelling or Grammar Mistakes',
  'General Inquiry',
];

// Data transfer object for creating ticket
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

  @IsNotEmpty()
  @IsString()
  @IsIn(categories)
  public category: string;
}

// DTO For updating Ticket
export class UpdateTicketDto {
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  public title?: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  @MaxLength(1024)
  public description?: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(['low', 'medium', 'high'])
  public priority?: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(['open', 'closed'])
  public status?: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(categories)
  public category?: string;
}

//DTO For adding a comment
export class CreateCommentDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(64)
  public text: string;
}
