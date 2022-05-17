import { Component, OnInit } from '@angular/core';

import { Client } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {

  private client: Client = new Client();

  constructor() { }

  ngOnInit(): void {
    this.client.webSocketFactory = () => {
      return new SockJS("http://localhost:8080/chat-websocket");
    }

    //Escuchar cuando nos conectamos o desconectamos
    this.client.onConnect = (frame: any) => {
      console.log('Conectados: ' + this.client.connected + ' : ' + frame);
    }
    this.client.activate();
  }

}
