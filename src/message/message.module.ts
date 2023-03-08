import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { PrismaService } from '../services/prisma.service';

@Module({
  providers: [MessageService, PrismaService],
  exports: [MessageService],
})
export class MessageModule {}
