import { Module } from '@nestjs/common';
import { ChatModule } from './chat/chat.module';
import {ServeStaticModule} from "@nestjs/serve-static";
import { join } from 'path';
import { UserModule } from './user/user.module';
import { MessageModule } from './message/message.module';

@Module({
  imports: [ChatModule,
    // ServeStaticModule.forRoot({
    //   rootPath: join(__dirname,'..', 'public'),
    // }),
    UserModule,
    MessageModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
