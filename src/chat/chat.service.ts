import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ChatRoom, RoomType } from './entities/chat-room.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ChannelMembership } from './entities/channel-membership.entity';
import { ChannelJoinRequest, JoinRequestStatus } from './entities/channel-join-request.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRoom)
    private roomRepository: Repository<ChatRoom>,
    @InjectRepository(ChatMessage)
    private messageRepository: Repository<ChatMessage>,
    @InjectRepository(ChannelMembership)
    private membershipRepository: Repository<ChannelMembership>,
    @InjectRepository(ChannelJoinRequest)
    private joinRequestRepository: Repository<ChannelJoinRequest>,
    private notificationsService: NotificationsService,
  ) {}

  async createRoom(createRoomDto: CreateRoomDto & { description?: string; isPrivate?: boolean; adminId?: number }): Promise<ChatRoom> {
    const room = this.roomRepository.create({
      name: createRoomDto.name,
      participantIds: createRoomDto.participantIds,
      type: createRoomDto.type || RoomType.CHANNEL,
      workspaceId: 1, // Default workspace
      description: createRoomDto.description,
      isPrivate: Boolean(createRoomDto.isPrivate),
      adminId: createRoomDto.adminId,
    });
    const saved = await this.roomRepository.save(room);
    // Ensure memberships mirror participantIds
    if (Array.isArray(saved.participantIds)) {
      const uniqueIds = Array.from(new Set(saved.participantIds));
      const memberships = uniqueIds.map((uid) => this.membershipRepository.create({ roomId: saved.id, userId: uid }));
      await this.membershipRepository.save(memberships);
    }
    return saved;
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

  async discoverChannels(userId: number): Promise<ChatRoom[]> {
    return this.roomRepository
      .createQueryBuilder('room')
      .where('room.type = :type', { type: RoomType.CHANNEL })
      .andWhere('NOT (:userId = ANY(room.participantIds))', { userId })
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
    // Basic membership check
    const isMember = await this.membershipRepository.findOne({ where: { roomId: sendMessageDto.roomId, userId: senderId } });
    if (!isMember) {
      throw new Error('You are not a member of this channel');
    }
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

  async requestToJoin(roomId: number, requesterId: number): Promise<ChannelJoinRequest> {
    // If already member, short-circuit
    const existingMembership = await this.membershipRepository.findOne({ where: { roomId, userId: requesterId } });
    if (existingMembership) {
      throw new Error('Already a member');
    }

    // If pending exists, return it
    const pending = await this.joinRequestRepository.findOne({ where: { roomId, requesterId, status: JoinRequestStatus.PENDING } });
    if (pending) return pending;

    const jr = this.joinRequestRepository.create({ roomId, requesterId, status: JoinRequestStatus.PENDING });
    const saved = await this.joinRequestRepository.save(jr);
    // Notify channel admin
    const room = await this.roomRepository.findOne({ where: { id: roomId } });
    if (room?.adminId) {
      await this.notificationsService.create({
        userId: room.adminId,
        type: 'CHANNEL_JOIN_REQUEST',
        title: 'Join request',
        message: `User ${requesterId} requested to join channel ${room.name}`,
        referenceId: saved.id,
        referenceType: 'CHANNEL_JOIN_REQUEST',
      });
    }
    return saved;
  }

  async approveJoin(requestId: number, approverId: number): Promise<ChannelJoinRequest> {
    const req = await this.joinRequestRepository.findOne({ where: { id: requestId } });
    if (!req) throw new Error('Join request not found');
    const room = await this.roomRepository.findOne({ where: { id: req.roomId } });
    if (!room) throw new Error('Room not found');
    if (room.adminId !== approverId) throw new Error('Only channel admin can approve');

    req.status = JoinRequestStatus.APPROVED;
    await this.joinRequestRepository.save(req);
    await this.membershipRepository.save(this.membershipRepository.create({ roomId: req.roomId, userId: req.requesterId }));

    // Also keep participantIds in sync
    const updatedIds = Array.from(new Set([...(room.participantIds || []), req.requesterId]));
    await this.roomRepository.update(room.id, { participantIds: updatedIds });
    // Notify requester
    await this.notificationsService.create({
      userId: req.requesterId,
      type: 'CHANNEL_JOIN_APPROVED',
      title: 'Join approved',
      message: `Your request to join ${room.name} was approved`,
      referenceId: req.id,
      referenceType: 'CHANNEL_JOIN_REQUEST',
    });
    return req;
  }

  async rejectJoin(requestId: number, approverId: number): Promise<ChannelJoinRequest> {
    const req = await this.joinRequestRepository.findOne({ where: { id: requestId } });
    if (!req) throw new Error('Join request not found');
    const room = await this.roomRepository.findOne({ where: { id: req.roomId } });
    if (!room) throw new Error('Room not found');
    if (room.adminId !== approverId) throw new Error('Only channel admin can reject');
    req.status = JoinRequestStatus.REJECTED;
    const saved = await this.joinRequestRepository.save(req);
    // Notify requester
    await this.notificationsService.create({
      userId: req.requesterId,
      type: 'CHANNEL_JOIN_REJECTED',
      title: 'Join rejected',
      message: `Your request to join ${room.name} was rejected`,
      referenceId: req.id,
      referenceType: 'CHANNEL_JOIN_REQUEST',
    });
    return saved;
  }

  async deleteRooms(roomIds: number[]): Promise<number> {
    if (!roomIds.length) return 0;
    await this.messageRepository.delete({ roomId: In(roomIds) });
    await this.membershipRepository.delete({ roomId: In(roomIds) });
    const res = await this.roomRepository.delete({ id: In(roomIds) });
    return res.affected || 0;
  }
}
