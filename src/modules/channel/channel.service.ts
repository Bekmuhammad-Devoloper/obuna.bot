import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channel } from '../../database/entities/channel.entity';

@Injectable()
export class ChannelService {
  private readonly logger = new Logger(ChannelService.name);

  constructor(
    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,
  ) {}

  async findAll(): Promise<Channel[]> {
    return this.channelRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findActive(): Promise<Channel[]> {
    return this.channelRepository.find({
      where: { isActive: true },
      order: { price: 'ASC' },
    });
  }

  async findById(id: string): Promise<Channel | null> {
    return this.channelRepository.findOne({
      where: { id },
    });
  }

  async findByTelegramId(telegramChannelId: string): Promise<Channel | null> {
    return this.channelRepository.findOne({
      where: { telegramChannelId },
    });
  }

  async create(data: {
    name: string;
    telegramChannelId: string;
    description?: string;
    price: number;
    duration: number;
  }): Promise<Channel> {
    const channel = this.channelRepository.create(data);
    return this.channelRepository.save(channel);
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      price: number;
      duration: number;
      isActive: boolean;
    }>,
  ): Promise<Channel | null> {
    await this.channelRepository.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.channelRepository.delete(id);
  }

  async toggleActive(id: string): Promise<Channel | null> {
    const channel = await this.findById(id);
    if (!channel) return null;

    channel.isActive = !channel.isActive;
    return this.channelRepository.save(channel);
  }

  async count(): Promise<number> {
    return this.channelRepository.count();
  }

  async countActive(): Promise<number> {
    return this.channelRepository.count({
      where: { isActive: true },
    });
  }
}
