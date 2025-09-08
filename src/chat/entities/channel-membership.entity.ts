import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Unique, Index } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { ChatRoom } from './chat-room.entity';
import { User } from '../../users/entities/user.entity';

@Entity('channel_memberships')
@Unique(['roomId', 'userId'])
@ObjectType()
export class ChannelMembership {
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
  userId: number;

  @CreateDateColumn()
  @Field()
  createdAt: Date;

  @ManyToOne(() => ChatRoom)
  @JoinColumn({ name: 'roomId' })
  room: ChatRoom;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}


