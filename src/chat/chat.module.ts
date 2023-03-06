import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import {ChatGetaway} from "./chat.getaway";
import {PrismaService} from "../services/prisma.service";
import {UserService} from "../user/user.service";
import {MessageService} from "../message/message.service";

@Module({
  providers: [ChatService,ChatGetaway, PrismaService, UserService, MessageService],
  controllers: []
})
export class ChatModule {}
