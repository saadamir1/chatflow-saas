import { InputType, Field, Int, ObjectType } from '@nestjs/graphql';
import { IsInt, IsArray } from 'class-validator';
import { ChannelJoinRequest } from '../entities/channel-join-request.entity';

@InputType()
export class RequestJoinInput {
  @Field(() => Int)
  @IsInt()
  roomId: number;
}

@InputType()
export class ApproveJoinInput {
  @Field(() => Int)
  @IsInt()
  requestId: number;
}

@InputType()
export class RejectJoinInput {
  @Field(() => Int)
  @IsInt()
  requestId: number;
}

@InputType()
export class DeleteRoomsInput {
  @Field(() => [Int])
  @IsArray()
  roomIds: number[];
}

@ObjectType()
export class JoinRequestPayload extends ChannelJoinRequest {}


