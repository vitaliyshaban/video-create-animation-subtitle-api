import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { RenderService } from './render.service';
import { Server } from 'socket.io';
import { OnModuleInit } from '@nestjs/common';

@WebSocketGateway()
export class RenderGateway implements OnModuleInit {
  constructor(private readonly renderService: RenderService) {}

  @WebSocketServer()
  server: Server;

  onModuleInit() {
    this.server.on('connection', (socket) => {
      console.log(socket.id);
    });
  }

  @SubscribeMessage('events')
  async findAll(@MessageBody() body: any): Promise<any> {
    console.log(body);
    return this.renderService.getHello();
  }
}
