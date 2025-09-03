import { Resolver, Mutation, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { InvitationsService } from './invitations.service';
import { Invitation } from './entities/invitation.entity';
import { InviteUserInput, InvitationResponse } from './dto/invitation.dto';

@Resolver(() => Invitation)
@UseGuards(JwtAuthGuard)
export class InvitationsResolver {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Mutation(() => InvitationResponse)
  inviteUser(
    @Args('inviteUserInput') inviteUserInput: InviteUserInput,
    @CurrentUser() user: any,
  ): Promise<InvitationResponse> {
    return this.invitationsService.inviteUser(
      inviteUserInput,
      user.workspaceId,
      user.userId,
    );
  }

  @Mutation(() => InvitationResponse)
  acceptInvitation(
    @Args('token') token: string,
  ): Promise<InvitationResponse> {
    return this.invitationsService.acceptInvitation(token);
  }

  @Query(() => [Invitation], { name: 'workspaceInvitations' })
  getWorkspaceInvitations(@CurrentUser() user: any): Promise<Invitation[]> {
    return this.invitationsService.getWorkspaceInvitations(user.workspaceId);
  }
}