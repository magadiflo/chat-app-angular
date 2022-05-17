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
  escribiendo: string = '';
  clienteId!: string;

  constructor() { }

  ngOnInit(): void {
    this.clienteId = 'id-' + new Date().getTime() + '-' + Math.random().toString(36).substring(2);

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
        if(!this.mensaje.color && mensaje.tipo == 'NUEVO_USUARIO' && this.mensaje.username == mensaje.username){
          this.mensaje.color = mensaje.color;
        }
        this.mensajes.push(mensaje);
        console.log(mensaje);
      });

      this.client.subscribe('/chat/escribiendo', e => {
        this.escribiendo = e.body;
        setTimeout(() => this.escribiendo = '', 3000);
      });

      console.log(this.clienteId);  

      this.client.subscribe(`/chat/historial/${this.clienteId}`, e => {
        const historial = JSON.parse(e.body) as MensajeModel[];
        this.mensajes = historial.map(m => {
          m.fecha = new Date(m.fecha!);
          return m;
        }).reverse();
      });

      this.client.publish({destination: '/app/historial', body: this.clienteId});

      this.mensaje.tipo = 'NUEVO_USUARIO';
      this.client.publish({
        destination: '/app/mensaje',
        body: JSON.stringify(this.mensaje),
      });
    }

    this.client.onDisconnect = (frame: any) => {
      console.log('Desconectados: ' + !this.client.connected + ' : ' + frame);
      this.conectado = false;
      this.mensaje = new MensajeModel();
      this.mensajes = [];
    }

  }

  conectar(): void {
    this.client.activate();
  }

  desconectar(): void {
    this.client.deactivate();
  }

  enviarMensaje(): void {
    this.mensaje.tipo = 'MENSAJE';
    this.client.publish({
      destination: '/app/mensaje',
      body: JSON.stringify(this.mensaje),
    });
    this.mensaje.texto = '';
  }

  escribiendoEvento(): void {
    this.client.publish({
      destination: '/app/escribiendo',
      body: this.mensaje.username,
    });
  }

}
