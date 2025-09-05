import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatRoom, RoomType } from './entities/chat-room.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRoom)
    private roomRepository: Repository<ChatRoom>,
    @InjectRepository(ChatMessage)
    private messageRepository: Repository<ChatMessage>,
  ) {}

  async createRoom(createRoomDto: CreateRoomDto): Promise<ChatRoom> {
    const room = this.roomRepository.create({
      name: createRoomDto.name,
      participantIds: createRoomDto.participantIds,
      type: createRoomDto.type || RoomType.CHANNEL,
      workspaceId: 1 // Default workspace
    });
    return this.roomRepository.save(room);
  }

  async findOrCreateDirectMessage(userId1: number, userId2: number): Promise<ChatRoom> {
    // Sort IDs to ensure consistent room naming
    const [id1, id2] = [userId1, userId2].sort((a, b) => a - b);
    
    // Check if DM room already exists
    const existingRoom = await this.roomRepository
      .createQueryBuilder('room')
      .where('room.type = :type', { type: RoomType.DIRECT_MESSAGE })
      .andWhere('room.participantIds @> :ids1 AND room.participantIds <@ :ids2', {
        ids1: [id1],
        ids2: [id1, id2]
      })
      .andWhere('array_length(room.participantIds, 1) = 2')
      .getOne();

    if (existingRoom) {
      return existingRoom;
    }

    // Create new DM room
    const room = this.roomRepository.create({
      name: `dm-${id1}-${id2}`,
      participantIds: [id1, id2],
      type: RoomType.DIRECT_MESSAGE,
      workspaceId: 1
    });
    
    return this.roomRepository.save(room);
  }

  async findUserRooms(userId: number): Promise<ChatRoom[]> {
    return this.roomRepository
      .createQueryBuilder('room')
      .where(':userId = ANY(room.participantIds)', { userId })
      .orderBy('room.createdAt', 'DESC')
      .getMany();
  }

  async findUserChannels(userId: number): Promise<ChatRoom[]> {
    return this.roomRepository
      .createQueryBuilder('room')
      .where(':userId = ANY(room.participantIds)', { userId })
      .andWhere('room.type = :type', { type: RoomType.CHANNEL })
      .orderBy('room.createdAt', 'DESC')
      .getMany();
  }

  async findUserDirectMessages(userId: number): Promise<ChatRoom[]> {
    return this.roomRepository
      .createQueryBuilder('room')
      .where(':userId = ANY(room.participantIds)', { userId })
      .andWhere('room.type = :type', { type: RoomType.DIRECT_MESSAGE })
      .orderBy('room.createdAt', 'DESC')
      .getMany();
  }

  async sendMessage(
    sendMessageDto: SendMessageDto,
    senderId: number,
  ): Promise<ChatMessage> {
    const message = this.messageRepository.create({
      ...sendMessageDto,
      senderId,
    });
    const saved = await this.messageRepository.save(message);
    // Always return with sender relation populated
    const found = await this.messageRepository.findOne({
      where: { id: saved.id },
      relations: ['sender'],
    });
    if (!found) {
      throw new Error('Message not found after save');
    }
    return found;
  }

  async getRoomMessages(roomId: number): Promise<ChatMessage[]> {
    return this.messageRepository.find({
      where: { roomId },
      order: { createdAt: 'ASC' },
      relations: ['sender'],
    });
  }
}
