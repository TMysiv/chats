import {
    OnGatewayConnection,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer
} from "@nestjs/websockets";
import {Server, Socket} from "socket.io";
import {ChatService} from "./chat.service";
import {UserService} from "../user/user.service";
import {IJoinRoom} from "./interfaces/join-room.interface";
import {MessageService} from "../message/message.service";
import {AuthService} from "../services/auth.service";
import {SocketExtends} from "../user/interfaces/socketExtends";

@WebSocketGateway()
export class ChatGetaway implements OnGatewayConnection{

    constructor(private chatService:ChatService,
                private userService: UserService,
                private messageService: MessageService,
                private authService: AuthService) {}

    @WebSocketServer()
    io: Server;

    async handleConnection(socket: SocketExtends) {
        const token = socket.handshake.headers.authorization;

        const validation = await this.authService.validateToken(token);

        if (!validation.id) {
            return socket.emit('auth error', 'Bad Authorization')
        }

        const userFromDb = await this.userService.getUserById(token);

        if (!userFromDb) {
           return socket.emit('auth error', `User not found`)
        }

        socket.user = userFromDb;

        const userChats = await this.chatService.getUserChats(userFromDb.id);

        socket.emit('connected', userChats);

    }

    @SubscribeMessage('join room')
    async joinRoom(socket: SocketExtends, data: IJoinRoom) {
        let room = data.room;

        if (!data.room) {
            const newChat = await this.chatService.createChat(data, socket.user.id);
            room = newChat.id;
            socket.emit('new chat', room)

            socket.emit('message', `Welcome to chat ${socket.user.fullName}`);
        }

        socket.join(room);

        const userInChat = await this.chatService.checkIfUserInChat(socket.user.id, data.room);

        if (!userInChat) {
            await this.chatService.enterToChat(socket.user.id, room);

            socket.emit('message', `Welcome to chat ${socket.user.fullName}`);
            this.io.to(room).emit('message', `${socket.user.fullName} connected to chat`);
        }

        const messagesFromChat = await this.messageService.getChatsMessages(room);
        socket.emit('all messages from chat', messagesFromChat)

        socket.on('chat message', async (data) => {
            this.io.in(data.room).emit('message', {fullName: socket.user.fullName, message: data.message})
            await this.messageService.createMessage(data.message, room, socket.user.id);
        })

        socket.on('leave room',async () => {
            socket.broadcast.to(room).emit('message',  `${socket.user.fullName} has left group`)
            await this.chatService.deleteUserFromChat(room, socket.user.id);
        })

    }

    @SubscribeMessage('unsubscribe')
        async unsubscribeRoom(socket: SocketExtends, room){
        socket.leave(room);
    }

}