import { Resolver, Mutation, Query, Args } from '@nestjs/graphql';
import {
  UseGuards,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import {
  LoginInput,
  RefreshTokenInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  EmailVerificationInput,
  VerifyEmailInput,
  AuthResponse,
  MessageResponse,
} from './dto/graphql-inputs';
import { CreateUserInput } from '../users/dto/graphql-inputs';
import { WorkspacesService } from '../workspaces/workspaces.service';

@Resolver()
export class AuthResolver {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private workspacesService: WorkspacesService,
  ) {}

  @Mutation(() => AuthResponse)
  async login(
    @Args('loginInput') loginInput: LoginInput,
  ): Promise<AuthResponse> {
    return this.authService.login(loginInput.email, loginInput.password);
  }

  @Mutation(() => AuthResponse)
  async refreshToken(
    @Args('refreshTokenInput') refreshTokenInput: RefreshTokenInput,
  ): Promise<AuthResponse> {
    return this.authService.refresh(refreshTokenInput.refreshToken);
  }

  @Mutation(() => MessageResponse)
  async register(
    @Args('registerInput') registerInput: CreateUserInput,
  ): Promise<MessageResponse> {
    const userExists = await this.usersService.findByEmail(registerInput.email);
    if (userExists) {
      throw new ConflictException('Email already in use');
    }

    const user = await this.usersService.create(registerInput);
    
    // Auto-create default workspace for user
    try {
      await this.workspacesService.create({
        name: `${registerInput.firstName}'s Workspace`,
        description: 'Default workspace'
      });
    } catch (error) {
      // Ignore workspace creation errors for now
      console.log('Workspace creation failed:', error.message);
    }
    
    await this.authService.sendEmailVerification(registerInput.email);

    return {
      message:
        'User registered successfully. Please check your email to verify your account.',
    };
  }

  @Mutation(() => AuthResponse)
  async bootstrapAdmin(
    @Args('bootstrapInput') bootstrapInput: CreateUserInput,
  ): Promise<AuthResponse> {
    const existingAdmin = await this.usersService.findByRole('admin');
    if (existingAdmin && existingAdmin.length > 0) {
      throw new ConflictException('Admin user already exists');
    }

    const adminUser = await this.usersService.create({
      ...bootstrapInput,
      role: 'admin',
      isEmailVerified: true,
    });

    const tokens = await this.authService.generateTokens(adminUser);
    await this.authService.updateRefreshToken(
      adminUser.id,
      tokens.refresh_token,
    );

    return tokens;
  }

  @Mutation(() => MessageResponse)
  async forgotPassword(
    @Args('forgotPasswordInput') forgotPasswordInput: ForgotPasswordInput,
  ): Promise<MessageResponse> {
    return this.authService.forgotPassword(forgotPasswordInput.email);
  }

  @Mutation(() => MessageResponse)
  async resetPassword(
    @Args('resetPasswordInput') resetPasswordInput: ResetPasswordInput,
  ): Promise<MessageResponse> {
    return this.authService.resetPassword(
      resetPasswordInput.token,
      resetPasswordInput.newPassword,
    );
  }

  @Mutation(() => MessageResponse)
  async sendEmailVerification(
    @Args('emailVerificationInput')
    emailVerificationInput: EmailVerificationInput,
  ): Promise<MessageResponse> {
    return this.authService.sendEmailVerification(emailVerificationInput.email);
  }

  @Mutation(() => MessageResponse)
  async resendEmailVerification(
    @Args('emailVerificationInput')
    emailVerificationInput: EmailVerificationInput,
  ): Promise<MessageResponse> {
    const user = await this.usersService.findByEmail(emailVerificationInput.email);
    if (!user) {
      return { message: 'If email exists, verification link has been sent' };
    }
    
    if (user.isEmailVerified) {
      return { message: 'Email is already verified' };
    }

    return this.authService.sendEmailVerification(emailVerificationInput.email);
  }

  @Mutation(() => MessageResponse)
  async verifyEmail(
    @Args('verifyEmailInput') verifyEmailInput: VerifyEmailInput,
  ): Promise<MessageResponse> {
    return this.authService.verifyEmail(verifyEmailInput.token);
  }

  @Query(() => User)
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: any): Promise<User> {
    const fullUser = await this.usersService.findOne(user.userId);
    if (!fullUser) {
      throw new NotFoundException('User not found');
    }

    const { password, refreshToken, ...userProfile } = fullUser;
    return userProfile as User;
  }
}
