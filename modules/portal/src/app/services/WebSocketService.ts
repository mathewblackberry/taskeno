import {Injectable} from '@angular/core';
import {fetchAuthSession} from "aws-amplify/auth";
import {from} from 'rxjs';
import {catchError, switchMap} from 'rxjs/operators';
import {ObservableWrapper} from "../wrapper/observable_wrapper";

@Injectable()
export class WebSocketService {
  private webSocket: WebSocket;
  private manuallyClosed: boolean = false;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 30;
  private readonly initialDelay = 1000; // Initial delay of 1 second
  private readonly maxDelay = 30000;
  public url: string;

  public _hash$: ObservableWrapper<string> = new ObservableWrapper<string>();



  connect(){
    console.log(`connecting`);
    return from(fetchAuthSession()).pipe(switchMap((session) => {
        console.log(session);
        const idToken = session.tokens?.idToken; // Get the ID token
        console.log(`Token: ${idToken}`);
        // Construct WebSocket URL with token as query parameter
        const wsUrl = `${this.url}&Authorization=${idToken}`;

        // Open WebSocket connection
        this.webSocket = new WebSocket(wsUrl);

        this.webSocket.onopen = () => {
          this.reconnectAttempts = 0;
          console.log('WebSocket connection opened');
        };

        this.webSocket.onmessage = (event) => {
          console.log(event);
          if(event.data.startsWith('{')) {
            this._hash$.value = JSON.parse(event.data).hash;
            // console.log(JSON.parse(event.data));
          }
        };

        this.webSocket.onclose = (event) => {
          if(!this.manuallyClosed){
            console.log('Attempting to reconnect');
            this.reconnect();
          }
          console.log('Connection closed', event);
        };

        this.webSocket.onerror = (event) => {
          console.error('WebSocket Error', event);
        };

        return from([true]); // Return success observable or other actions if needed
      }),
      catchError((error) => {
        console.error('Error fetching session:', error);
        return from([false]); // Return error observable or handle error gracefully
      })
    );
  }



  private reconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        console.log('Reconnecting attempt:', this.reconnectAttempts + 1);
        this.connect().subscribe({
          next: (result) => {
            if (result) {
              console.log(result);
              console.log('WebSocket connection initiated successfully');
            } else {
              console.log('WebSocket connection failed');
            }
          },
          error: (error) => {
            console.error('Error during WebSocket connection:', error);
          },
          complete: () => {
            console.log('WebSocket connection handling complete');
          }
        });
      }, this.getReconnectDelay());

      this.reconnectAttempts++;
    } else {
      console.log('Max reconnect attempts reached. Giving up on reconnection.');
    }
  }

  private getReconnectDelay(): number {
    const delay = Math.min(this.initialDelay * Math.pow(2, this.reconnectAttempts), this.maxDelay);
    return delay;
  }

  public sendMessage(message: string): void {
    if (this.webSocket.readyState === WebSocket.OPEN) {
      this.webSocket.send(message);
    } else {
      console.error('WebSocket is not connected.');
    }
  }

  public closeWebSocket(): void {
    this.manuallyClosed = true;
    if (this.webSocket) {
      this.webSocket.close();
    }
  }
}
