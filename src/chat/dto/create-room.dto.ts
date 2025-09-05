import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsArray, IsOptional, IsEnum } from 'class-validator';
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
}
