import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { ChatMessage } from './chat-message.entity';
import { User } from '../../users/entities/user.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';

export enum RoomType {
  CHANNEL = 'CHANNEL',
  DIRECT_MESSAGE = 'DIRECT_MESSAGE'
}

registerEnumType(RoomType, {
  name: 'RoomType',
});

@Entity('chat_rooms')
@ObjectType()
export class ChatRoom {
  @PrimaryGeneratedColumn()
  @Field(() => ID)
  id: number;

  @Column()
  @Field()
  name: string;

  @Column({ nullable: true })
  @Field({ nullable: true })
  description?: string;

  @Column('int', { array: true })
  @Field(() => [Number])
  participantIds: number[];

  @Column({
    type: 'enum',
    enum: RoomType,
    default: RoomType.CHANNEL
  })
  @Field(() => RoomType)
  type: RoomType;

  @Column({ default: false })
  @Field()
  isPrivate: boolean;

  @Column({ nullable: true })
  @Field(() => Number, { nullable: true })
  adminId?: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'adminId' })
  @Field(() => User, { nullable: true })
  admin?: User;

  @CreateDateColumn()
  @Field()
  createdAt: Date;

  @OneToMany(() => ChatMessage, (message) => message.room)
  @Field(() => [ChatMessage])
  messages: ChatMessage[];

  @Field(() => Workspace)
  @ManyToOne(() => Workspace)
  @JoinColumn({ name: 'workspaceId' })
  workspace: Workspace;

  @Column()
  workspaceId: number;
}
