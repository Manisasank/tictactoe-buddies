/**
 * XO Arena - Host-Authoritative WebRTC Network Layer (PeerJS)
 * Author: Y Mani Sasank Reddy <https://github.com/Manisasank>
 */

import { Player, GameState } from '../core/types';

export interface NetworkMessage {
  type: 
    | 'JOIN_REQUEST'
    | 'JOIN_ACCEPTED'
    | 'SUBMIT_MOVE'
    | 'MOVE_ACCEPTED'
    | 'MOVE_REJECTED'
    | 'REMATCH_OFFER'
    | 'REMATCH_ACCEPTED'
    | 'CHAT_EMOTE'
    | 'HEARTBEAT';
  sender?: string;
  avatar?: string;
  elo?: number;
  cellIndex?: number;
  player?: Player;
  state?: GameState;
  emote?: string;
  reason?: string;
}

export type NetworkEvent =
  | { type: 'CONNECTED'; peerId: string }
  | { type: 'PEER_JOINED'; peerName: string; peerAvatar: string; peerElo: number }
  | { type: 'OPPONENT_MOVED'; cellIndex: number; player: Player }
  | { type: 'OPPONENT_DISCONNECTED'; graceRemainingSec: number }
  | { type: 'OPPONENT_RECONNECTED' }
  | { type: 'OPPONENT_FORFEIT' }
  | { type: 'EMOTE_RECEIVED'; emote: string }
  | { type: 'ERROR'; error: string };

export class NetworkManager {
  private peer: any = null;
  private conn: any = null;
  private isHost: boolean = false;
  private roomCode: string | null = null;
  private listeners: ((event: NetworkEvent) => void)[] = [];
  private reconnectTimer: number | null = null;
  private heartbeatInterval: number | null = null;

  constructor() {}

  public subscribe(listener: (event: NetworkEvent) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private emit(event: NetworkEvent): void {
    this.listeners.forEach(fn => fn(event));
  }

  /**
   * Initializes PeerJS client with standard free STUN servers
   */
  private async initPeer(customId?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        // Dynamic import or global fallback
        const PeerClass = (window as any).Peer || (window as any).peerjs?.Peer;
        if (!PeerClass) {
          // If PeerJS isn't globally loaded, dynamically inject it
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
          script.onload = () => {
            const P = (window as any).Peer;
            const instance = customId ? new P(customId) : new P();
            this.setupPeerListeners(instance, resolve, reject);
          };
          script.onerror = () => reject(new Error('Failed to load PeerJS WebRTC library'));
          document.head.appendChild(script);
        } else {
          const instance = customId ? new PeerClass(customId) : new PeerClass();
          this.setupPeerListeners(instance, resolve, reject);
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  private setupPeerListeners(peerInstance: any, resolve: (p: any) => void, reject: (err: any) => void): void {
    peerInstance.on('open', (id: string) => {
      this.peer = peerInstance;
      this.emit({ type: 'CONNECTED', peerId: id });
      resolve(peerInstance);
    });

    peerInstance.on('connection', (connection: any) => {
      if (this.isHost && !this.conn) {
        this.conn = connection;
        this.setupConnectionListeners(connection);
      }
    });

    peerInstance.on('error', (err: any) => {
      this.emit({ type: 'ERROR', error: err.message || 'WebRTC Peer Error' });
    });
  }

  private setupConnectionListeners(connection: any): void {
    connection.on('open', () => {
      this.startHeartbeat();
      if (this.reconnectTimer) {
        window.clearInterval(this.reconnectTimer);
        this.reconnectTimer = null;
        this.emit({ type: 'OPPONENT_RECONNECTED' });
      }
    });

    connection.on('data', (data: NetworkMessage) => {
      this.handleIncomingMessage(data);
    });

    connection.on('close', () => {
      this.handleDisconnect();
    });
  }

  private handleIncomingMessage(msg: NetworkMessage): void {
    switch (msg.type) {
      case 'JOIN_REQUEST':
        if (this.isHost) {
          this.emit({
            type: 'PEER_JOINED',
            peerName: msg.sender || 'Rival',
            peerAvatar: msg.avatar || '🌐',
            peerElo: msg.elo || 1200
          });
        }
        break;

      case 'SUBMIT_MOVE':
      case 'MOVE_ACCEPTED':
        if (msg.cellIndex !== undefined && msg.player) {
          this.emit({
            type: 'OPPONENT_MOVED',
            cellIndex: msg.cellIndex,
            player: msg.player
          });
        }
        break;

      case 'CHAT_EMOTE':
        if (msg.emote) {
          this.emit({ type: 'EMOTE_RECEIVED', emote: msg.emote });
        }
        break;

      case 'HEARTBEAT':
        // Connection alive
        break;
    }
  }

  private startHeartbeat(): void {
    if (this.heartbeatInterval) window.clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = window.setInterval(() => {
      if (this.conn && this.conn.open) {
        this.conn.send({ type: 'HEARTBEAT' });
      }
    }, 5000);
  }

  private handleDisconnect(): void {
    let graceSec = 30;
    this.emit({ type: 'OPPONENT_DISCONNECTED', graceRemainingSec: graceSec });

    if (this.reconnectTimer) window.clearInterval(this.reconnectTimer);
    this.reconnectTimer = window.setInterval(() => {
      graceSec -= 1;
      if (graceSec <= 0) {
        window.clearInterval(this.reconnectTimer!);
        this.reconnectTimer = null;
        this.emit({ type: 'OPPONENT_FORFEIT' });
      } else {
        this.emit({ type: 'OPPONENT_DISCONNECTED', graceRemainingSec: graceSec });
      }
    }, 1000);
  }

  /**
   * Host creates a new room with a clean 6-digit code
   */
  public async createRoom(): Promise<string> {
    this.isHost = true;
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.roomCode = randomCode;

    const hostPeerId = `xo-arena-${randomCode}`;
    await this.initPeer(hostPeerId);
    return randomCode;
  }

  /**
   * Guest joins an existing room by code
   */
  public async joinRoom(code: string, guestProfile: { name: string; avatar: string; elo: number }): Promise<void> {
    this.isHost = false;
    this.roomCode = code.toUpperCase();

    const hostPeerId = `xo-arena-${this.roomCode}`;
    await this.initPeer();

    this.conn = this.peer.connect(hostPeerId);
    this.setupConnectionListeners(this.conn);

    this.conn.on('open', () => {
      this.conn.send({
        type: 'JOIN_REQUEST',
        sender: guestProfile.name,
        avatar: guestProfile.avatar,
        elo: guestProfile.elo
      });
      this.emit({
        type: 'PEER_JOINED',
        peerName: 'Host Room',
        peerAvatar: '👑',
        peerElo: 1200
      });
    });
  }

  public sendMove(cellIndex: number, player: Player): void {
    if (this.conn && this.conn.open) {
      this.conn.send({
        type: 'SUBMIT_MOVE',
        cellIndex,
        player
      });
    }
  }

  public sendEmote(emote: string): void {
    if (this.conn && this.conn.open) {
      this.conn.send({
        type: 'CHAT_EMOTE',
        emote
      });
    }
  }

  public getRoomCode(): string | null {
    return this.roomCode;
  }

  public isRoomHost(): boolean {
    return this.isHost;
  }

  public disconnect(): void {
    if (this.heartbeatInterval) window.clearInterval(this.heartbeatInterval);
    if (this.reconnectTimer) window.clearInterval(this.reconnectTimer);
    if (this.conn) this.conn.close();
    if (this.peer) this.peer.destroy();
    this.conn = null;
    this.peer = null;
    this.roomCode = null;
  }
}
