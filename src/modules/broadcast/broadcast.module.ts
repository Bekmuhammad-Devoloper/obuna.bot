import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Broadcast } from '../../database/entities/broadcast.entity';
import { BroadcastService } from './broadcast.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([Broadcast]), UserModule],
  providers: [BroadcastService],
  exports: [BroadcastService],
})
export class BroadcastModule {}
