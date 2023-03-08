import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection, OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer
} from "@nestjs/websockets";
import {Server} from "socket.io";
import {ChatService} from "./chat.service";
import {UserService} from "../user/user.service";
import {IJoinRoom} from "./interfaces/join-room.interface";
import {MessageService} from "../message/message.service";
import {AuthService} from "../services/auth.service";
import {SocketExtends} from "../user/interfaces/socketExtends";
import {ICreateMessage} from "../message/interfaces/create-message.interface";

@WebSocketGateway()
export class ChatGetaway implements OnGatewayConnection, OnGatewayDisconnect{

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

        const userFromDb = await this.userService.getUserById(validation.id);

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
            socket.broadcast.to(room).emit('message', `${socket.user.fullName} connected to chat`);
        }

        const messagesFromChat = await this.messageService.getChatsMessages(room);
        socket.emit('all messages from chat', messagesFromChat)

    }

    @SubscribeMessage('chat message')
    async createMessage(@ConnectedSocket() socket: SocketExtends, @MessageBody() data: ICreateMessage){
        this.io.to(data.room).emit('message', {fullName: socket.user.fullName, message: data.message})
        await this.messageService.createMessage(data.message, data.room, socket.user.id);
    }

    @SubscribeMessage('leave room')
    async leaveRoom(@ConnectedSocket() socket: SocketExtends, @MessageBody() data){
        socket.broadcast.to(data.room).emit('message',  `${socket.user.fullName} has left group`)
        await this.chatService.deleteUserFromChat(data.room, socket.user.id);
    }

    async handleDisconnect(socket: SocketExtends) {
        console.log(socket.id);
    }

}