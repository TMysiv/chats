import {Injectable} from '@nestjs/common';
import {PrismaService} from "../services/prisma.service";
import {IJoinRoom} from "./interfaces/join-room.interface";
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ChatService {

    constructor(private prismaService: PrismaService) {
    }

    async getUserChats(userId: string) {
        return this.prismaService.chats.findMany({
            where: {
                members: {
                    has: userId
                }
            }
        })
    }

    async createChat(data: IJoinRoom, userId: string) {
        const id = uuidv4();
        return this.prismaService.chats.create({
            data: {
                id,
                members: [userId, data.replyTo]
            }
        })
    }

    async checkIfUserInChat(userId: string, roomId: string) {
        return this.prismaService.chats.findFirst({
            where: {
                id: roomId,
                members: {
                    has: userId
                }
            }
        })
    }

    async enterToChat(userId: string, roomId: string) {
        return this.prismaService.chats.update({
            where: {
                id: roomId,
            },
            data: {
                members: {
                    push: userId
                }
            }
        })
    }
}
