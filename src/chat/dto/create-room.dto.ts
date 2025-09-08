import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsArray, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { RoomType } from '../entities/chat-room.entity';

@InputType()
export class CreateRoomDto {
  @Field()
  @IsString()
  name: string;

  @Field(() => [Number])
  @IsArray()
  participantIds: number[];

  @Field(() => RoomType, { nullable: true })
  @IsOptional()
  @IsEnum(RoomType)
  type?: RoomType;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}
