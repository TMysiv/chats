import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import {ChatGetaway} from "./chat.getaway";
import {PrismaService} from "../services/prisma.service";

@Module({
  providers: [ChatService,ChatGetaway, PrismaService],
  controllers: [ChatController]
})
export class ChatModule {}
