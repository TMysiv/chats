import {Injectable} from '@nestjs/common';
import {PrismaService} from "../services/prisma.service";

@Injectable()
export class ChatService {

    constructor(private prismaService: PrismaService) {
    }

    async userJoinToChat(room: string, username: string, userId: string) {
        return this.prismaService.chats.create({
            data: {
                id: userId,
                username,
                room
            }
        })
    }

    async getUsersFromChat(room: string) {
        return this.prismaService.chats.findMany({
            where: {
                room
            }
        })
    }

    async getCurrentUser(id: string) {
        return this.prismaService.chats.findFirst({
            where: {
                id
            }
        })
    }

    async deleteUserFromChat(userId: string) {
        return this.prismaService.chats.delete({
            where: {
                id: userId
            }
        })
    }
}
