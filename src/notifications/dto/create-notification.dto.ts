import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsNumber, IsOptional } from 'class-validator';

@InputType()
export class CreateNotificationDto {
  @Field()
  @IsNumber()
  userId: number;

  @Field()
  @IsString()
  type: string;

  @Field()
  @IsString()
  title: string;

  @Field()
  @IsString()
  message: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  referenceId?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  referenceType?: string;
}
