import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invitation, InvitationStatus } from './entities/invitation.entity';
import { InviteUserInput } from './dto/invitation.dto';
import { EmailService } from '../common/services/email.service';
import { UsersService } from '../users/users.service';
import { randomBytes } from 'crypto';

@Injectable()
export class InvitationsService {
  constructor(
    @InjectRepository(Invitation)
    private invitationRepository: Repository<Invitation>,
    private emailService: EmailService,
    private usersService: UsersService,
  ) {}

  async inviteUser(
    inviteUserInput: InviteUserInput,
    workspaceId: number,
    invitedById: number,
  ): Promise<{ message: string; success: boolean }> {
    const { email, message } = inviteUserInput;

    // Check if user already exists in workspace
    const existingUser = await this.usersService.findByEmailAndWorkspace(email, workspaceId);
    if (existingUser) {
      throw new ConflictException('User is already a member of this workspace');
    }

    // Check for existing pending invitation
    const existingInvitation = await this.invitationRepository.findOne({
      where: { 
        email, 
        workspaceId, 
        status: InvitationStatus.PENDING 
      },
    });

    if (existingInvitation) {
      throw new ConflictException('Invitation already sent to this email');
    }

    // Create invitation
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const invitation = this.invitationRepository.create({
      email,
      token,
      workspaceId,
      invitedById,
      expiresAt,
    });

    await this.invitationRepository.save(invitation);

    // Send invitation email
    await this.emailService.sendInvitationEmail(email, token, message);

    return {
      message: 'Invitation sent successfully',
      success: true,
    };
  }

  async acceptInvitation(token: string): Promise<{ message: string; success: boolean }> {
    const invitation = await this.invitationRepository.findOne({
      where: { token, status: InvitationStatus.PENDING },
      relations: ['workspace'],
    });

    if (!invitation) {
      throw new NotFoundException('Invalid or expired invitation');
    }

    if (invitation.expiresAt < new Date()) {
      invitation.status = InvitationStatus.EXPIRED;
      await this.invitationRepository.save(invitation);
      throw new NotFoundException('Invitation has expired');
    }

    // Mark invitation as accepted
    invitation.status = InvitationStatus.ACCEPTED;
    await this.invitationRepository.save(invitation);

    return {
      message: 'Invitation accepted successfully',
      success: true,
    };
  }

  async getWorkspaceInvitations(workspaceId: number): Promise<Invitation[]> {
    return this.invitationRepository.find({
      where: { workspaceId },
      relations: ['invitedBy'],
      order: { createdAt: 'DESC' },
    });
  }
}