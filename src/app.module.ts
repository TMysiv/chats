import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatModule } from './chat/chat.module';
import { UserModule } from './user/user.module';
import { MessageModule } from './message/message.module';

@Module({
  imports: [
      ChatModule,
      UserModule,
      MessageModule,
      ConfigModule.forRoot({ envFilePath: '.env' }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
