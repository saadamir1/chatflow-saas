import { InputType, Field, ObjectType } from '@nestjs/graphql';
import { IsEmail, IsString } from 'class-validator';

@InputType()
export class InviteUserInput {
  @Field()
  @IsEmail()
  email: string;

  @Field({ nullable: true })
  @IsString()
  message?: string;
}

@ObjectType()
export class InvitationResponse {
  @Field()
  message: string;

  @Field()
  success: boolean;
}