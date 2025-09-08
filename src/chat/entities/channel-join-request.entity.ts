import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { ChatRoom } from './chat-room.entity';
import { User } from '../../users/entities/user.entity';

export enum JoinRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

registerEnumType(JoinRequestStatus, { name: 'JoinRequestStatus' });

@Entity('channel_join_requests')
@ObjectType()
export class ChannelJoinRequest {
  @PrimaryGeneratedColumn()
  @Field(() => ID)
  id: number;

  @Column()
  @Index()
  @Field()
  roomId: number;

  @Column()
  @Index()
  @Field()
  requesterId: number;

  @Column({ type: 'enum', enum: JoinRequestStatus, default: JoinRequestStatus.PENDING })
  @Field(() => JoinRequestStatus)
  status: JoinRequestStatus;

  @CreateDateColumn()
  @Field()
  createdAt: Date;

  @ManyToOne(() => ChatRoom)
  @JoinColumn({ name: 'roomId' })
  room: ChatRoom;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'requesterId' })
  requester: User;
}


