import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection, OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer
} from "@nestjs/websockets";
import {Server, Socket} from "socket.io";
import {ChatService} from "./chat.service";
import {UserService} from "../user/user.service";
import {IJoinRoom} from "./interfaces/join-room.interface";
import {IUser} from "../user/interfaces/user.interface";

@WebSocketGateway({
    cors: {
        origin: '*'
    }
})
export class ChatGetaway implements OnGatewayConnection, OnGatewayDisconnect{

    constructor(private chatService:ChatService, private userService: UserService) {}

    @WebSocketServer()
    io: Server;
    userFromDb:IUser

    async handleConnection(socket: Socket) {
        const userId = socket.handshake.headers.authorization;
        this.userFromDb = await this.userService.getUserById(userId);

        if (!this.userFromDb) {
           return  socket.emit('auth error', `User not found`)
        }

        const userChats = await this.chatService.getUserChats(this.userFromDb.id);

        socket.emit('connected', userChats);

    }

    @SubscribeMessage('join room')
    async joinRoom(socket: Socket, data: IJoinRoom) {
        let room = data.room;

        if (!data.room) {
            const newChat = await this.chatService.createChat(data, this.userFromDb.id);
            room = newChat.id;

            socket.emit('message', `Welcome to chat ${this.userFromDb.fullName}`);
        }

        socket.join(room);

        const userInChat = await this.chatService.checkIfUserInChat(this.userFromDb.id, data.room);

        if (!userInChat) {
            await this.chatService.enterToChat(this.userFromDb.id, room);

            socket.emit('message', `Welcome to chat ${this.userFromDb.fullName}`);
            socket.broadcast.to(room).emit('message', `${this.userFromDb.fullName} connected to chat`);
        }


        socket.on('chat message', (message: string) => {
            this.io.to(room).emit('message', {fullName: this.userFromDb.fullName, message})
        })

        // socket.on('disconnect',async () => {
        //     this.io.to(room).emit('message', {username: 'Bot', text: `${username} has left group`})
        //     await this.chatService.deleteUserFromChat(socket.id);
        //     this.io.to(room).emit('roomUsers',{room, users})
        // })
    }

    @SubscribeMessage('chatMessage')
    async receiveMessage(@MessageBody() message, @ConnectedSocket() socket: Socket) {
        // const user = await this.chatService.getCurrentUser(socket.id);
        // this.io.to(user.room).emit('message',{username: user.username, text: message} )
    }


    handleDisconnect(socket: Socket) {
    }



}