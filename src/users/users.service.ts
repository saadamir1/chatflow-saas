import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { CreateUserInput, UpdateProfileInput, ChangePasswordInput } from './dto/graphql-inputs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(page: number = 1, limit: number = 10) {
    const [users, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      data: users,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<User | null> {
    try {
      return await this.userRepository.findOne({ where: { id: id } });
    } catch (error) {
      console.error('Error finding user:', error);
      return null;
    }
  }

  async update(id: number, updateUserInput: any) {
    const user = await this.userRepository.preload({
      id,
      ...updateUserInput,
    });
    if (!user) {
      throw new UnauthorizedException(`User with id ${id} not found`);
    }
    return this.userRepository.save(user);
  }

  async remove(id: number) {
    const user = await this.findOne(id);
    if (!user) {
      throw new UnauthorizedException(`User with id ${id} not found`);
    }
    return this.userRepository.delete(id);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByEmailAndWorkspace(email: string, workspaceId: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { email, workspaceId } });
  }

  async findByRole(role: 'user' | 'admin'): Promise<User[]> {
    return this.userRepository.find({ where: { role } });
  }

  async create(createUserInput: CreateUserInput) {
    const hashedPassword = await bcrypt.hash(createUserInput.password, 10);
    const user = this.userRepository.create({
      ...createUserInput,
      password: hashedPassword,
    });
    return this.userRepository.save(user);
  }

  async updateProfile(userId: number, updateProfileInput: UpdateProfileInput): Promise<User> {
    const user = await this.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Update only provided fields
    Object.assign(user, updateProfileInput);
    return this.userRepository.save(user);
  }

  async changePassword(userId: number, changePasswordInput: ChangePasswordInput): Promise<{ message: string }> {
    const user = await this.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(changePasswordInput.currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(changePasswordInput.newPassword, 10);
    
    // Update password
    user.password = hashedNewPassword;
    await this.userRepository.save(user);

    return { message: 'Password changed successfully' };
  }
}
