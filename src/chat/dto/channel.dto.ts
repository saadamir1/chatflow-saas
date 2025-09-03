import { InputType, Field, ObjectType, Int } from '@nestjs/graphql';
import { IsString, IsOptional, IsArray, MinLength, MaxLength } from 'class-validator';

@InputType()
export class CreateChannelInput {
  @Field()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @Field(() => [Int])
  @IsArray()
  participantIds: number[];

  @Field({ defaultValue: false })
  @IsOptional()
  isPrivate?: boolean;
}

@InputType()
export class UpdateChannelInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @Field(() => [Int], { nullable: true })
  @IsOptional()
  @IsArray()
  participantIds?: number[];
}

@ObjectType()
export class ChannelStats {
  @Field(() => Int)
  totalMessages: number;

  @Field(() => Int)
  activeUsers: number;

  @Field()
  lastActivity: Date;
}