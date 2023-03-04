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

@WebSocketGateway({
    cors: {
        origin: '*'
    }
})
export class ChatGetaway implements OnGatewayConnection, OnGatewayDisconnect{
    constructor(private chatService:ChatService) {}

    @WebSocketServer()
    io: Server

    @SubscribeMessage('join room')
    async joinRoom(socket: Socket, {room,username}) {

        const user = await this.chatService.userJoinToChat(room,username, socket.id);
        socket.join(user.room);

        socket.emit('message', {username: 'Bot', text: `Welcome ${user.username} to Chat ${user.room}` })

        socket.broadcast.to(user.room).emit('message',
            {username: 'Bot', text: `${user.username} connected to Chat ${user.room}`})

        const users = await this.chatService.getUsersFromChat(room);
        this.io.to(room).emit('roomUsers', {room, users})

        socket.on('disconnect',async () => {
            this.io.to(room).emit('message', {username: 'Bot', text: `${username} has left group`})
            await this.chatService.deleteUserFromChat(socket.id);
            this.io.to(room).emit('roomUsers',{room, users})
        })
    }

    @SubscribeMessage('chatMessage')
    async receiveMessage(@MessageBody() message, @ConnectedSocket() socket: Socket) {
        const user = await this.chatService.getCurrentUser(socket.id);
        this.io.to(user.room).emit('message',{username: user.username, text: message} )
    }


    handleDisconnect(socket: Socket) {
    }

    async handleConnection(socket: Socket) {
    }

}