import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanType } from '../entities/subscription.entity';
import { UsageRecord } from '../entities/usage.entity';

interface PlanLimits {
  users: number;
  messages: number; // per month
  storage: number; // in MB
  rooms: number;
}

@Injectable()
export class PlanLimitsService {
  constructor(
    @InjectRepository(UsageRecord)
    private usageRepository: Repository<UsageRecord>,
  ) {}

  getPlanLimits(planType: PlanType): PlanLimits {
    const limits = {
      [PlanType.FREE]: {
        users: 5,
        messages: 1000,
        storage: 1024, // 1GB
        rooms: 3,
      },
      [PlanType.PRO]: {
        users: 50,
        messages: 50000,
        storage: 10240, // 10GB
        rooms: 50,
      },
      [PlanType.ENTERPRISE]: {
        users: -1, // unlimited
        messages: -1, // unlimited
        storage: 102400, // 100GB
        rooms: -1, // unlimited
      },
    };

    return limits[planType];
  }

  async checkLimit(
    workspaceId: number,
    feature: string,
    planType: PlanType,
    currentUsage?: number,
  ): Promise<{ allowed: boolean; limit: number; current: number }> {
    const limits = this.getPlanLimits(planType);
    const limit = limits[feature];

    if (limit === -1) {
      return { allowed: true, limit: -1, current: currentUsage || 0 };
    }

    let current = currentUsage;
    if (current === undefined) {
      current = await this.getCurrentUsage(workspaceId, feature);
    }

    return {
      allowed: current < limit,
      limit,
      current,
    };
  }

  async recordUsage(
    workspaceId: number,
    feature: string,
    quantity: number = 1,
  ): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let record = await this.usageRepository.findOne({
      where: { workspaceId, feature, date: today },
    });

    if (record) {
      record.quantity += quantity;
    } else {
      record = this.usageRepository.create({
        workspaceId,
        feature,
        quantity,
        date: today,
      });
    }

    await this.usageRepository.save(record);
  }

  async getCurrentUsage(workspaceId: number, feature: string): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const result = await this.usageRepository
      .createQueryBuilder('usage')
      .select('SUM(usage.quantity)', 'total')
      .where('usage.workspaceId = :workspaceId', { workspaceId })
      .andWhere('usage.feature = :feature', { feature })
      .andWhere('usage.date >= :startOfMonth', { startOfMonth })
      .getRawOne();

    return parseInt(result.total) || 0;
  }

  async getWorkspaceUsage(workspaceId: number): Promise<Record<string, number>> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const records = await this.usageRepository
      .createQueryBuilder('usage')
      .select(['usage.feature', 'SUM(usage.quantity) as total'])
      .where('usage.workspaceId = :workspaceId', { workspaceId })
      .andWhere('usage.date >= :startOfMonth', { startOfMonth })
      .groupBy('usage.feature')
      .getRawMany();

    const usage = {};
    records.forEach(record => {
      usage[record.usage_feature] = parseInt(record.total);
    });

    return usage;
  }
}