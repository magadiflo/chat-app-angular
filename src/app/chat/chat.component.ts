import { Component, OnInit } from '@angular/core';

import { Client } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import { MensajeModel } from './models/mensaje.model';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {

  private client: Client = new Client();
  conectado: boolean = false;
  mensaje: MensajeModel = new MensajeModel();
  mensajes: MensajeModel[] = [];

  constructor() { }

  ngOnInit(): void {
    this.client.webSocketFactory = () => {
      return new SockJS("http://localhost:8080/chat-websocket");
    }

    //Escuchar cuando nos conectamos o desconectamos
    this.client.onConnect = (frame: any) => {
      console.log('Conectados: ' + this.client.connected + ' : ' + frame);
      this.conectado = true;

      //*Nos subscribimos y escuchamos los mensajes
      this.client.subscribe('/chat/mensaje', e => {
        let mensaje: MensajeModel = JSON.parse(e.body) as MensajeModel;
        mensaje.fecha = new Date(mensaje.fecha!);//*Como viene en milisegundos, lo convertimos
        this.mensajes.push(mensaje);
        console.log(mensaje);  
      });
    }

    this.client.onDisconnect = (frame: any) => {
      console.log('Desconectados: ' + !this.client.connected + ' : ' + frame);
      this.conectado = false;
    }

  }

  conectar(): void {
    this.client.activate();
  }

  desconectar(): void {
    this.client.deactivate();
  }

  enviarMensaje(): void {
    this.client.publish({
      destination: '/app/mensaje',
      body: JSON.stringify(this.mensaje),
    });
    this.mensaje.texto = '';
  }

}
