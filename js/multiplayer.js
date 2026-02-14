import * as sb from './supabase.js';

export class Multiplayer {
  constructor() {
    this.active = false;
    this.isHost = false;
    this.roomCode = '';
    this.maxPlayers = 2;
    this.playerId = '';
    this.players = {};     // { id: { input: {left,right,fire}, ready: bool } }
    this.onStateReceived = null;  // callback for clients
    this.onPlayerJoined = null;
    this.onPlayerLeft = null;
    this.onGameStart = null;
    this.remoteInputs = {};
  }

  generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  createRoom(maxPlayers, callbacks) {
    this.roomCode = this.generateCode();
    this.maxPlayers = maxPlayers;
    this.isHost = true;
    this.playerId = 'host';
    this.active = true;
    this.players = { host: { input: {}, ready: true } };
    this.setupCallbacks(callbacks);

    sb.createRoom(this.roomCode, (msg) => this.handleMessage(msg));
    return this.roomCode;
  }

  joinRoom(roomCode, callbacks) {
    this.roomCode = roomCode.toUpperCase();
    this.isHost = false;
    this.playerId = 'p' + Math.random().toString(36).slice(2, 8);
    this.active = true;
    this.setupCallbacks(callbacks);

    sb.joinRoom(this.roomCode, (msg) => this.handleMessage(msg));

    // Announce self
    sb.broadcastToRoom({
      type: 'join',
      playerId: this.playerId,
    });
  }

  setupCallbacks(callbacks) {
    this.onStateReceived = callbacks.onState || null;
    this.onPlayerJoined = callbacks.onPlayerJoined || null;
    this.onPlayerLeft = callbacks.onPlayerLeft || null;
    this.onGameStart = callbacks.onGameStart || null;
  }

  handleMessage(msg) {
    switch (msg.type) {
      case 'join':
        if (this.isHost) {
          this.players[msg.playerId] = { input: {}, ready: true };
          // Broadcast lobby state
          sb.broadcastToRoom({
            type: 'lobby',
            players: Object.keys(this.players),
            maxPlayers: this.maxPlayers,
          });
          if (this.onPlayerJoined) this.onPlayerJoined(Object.keys(this.players).length);
        }
        break;

      case 'lobby':
        if (!this.isHost) {
          if (this.onPlayerJoined) this.onPlayerJoined(msg.players.length);
        }
        break;

      case 'input':
        if (this.isHost) {
          this.remoteInputs[msg.playerId] = msg.input;
        }
        break;

      case 'state':
        if (!this.isHost && this.onStateReceived) {
          this.onStateReceived(msg.state);
        }
        break;

      case 'start':
        if (!this.isHost && this.onGameStart) {
          this.onGameStart(msg);
        }
        break;

      case 'leave':
        if (this.isHost) {
          delete this.players[msg.playerId];
          delete this.remoteInputs[msg.playerId];
        }
        break;
    }
  }

  sendInput(input) {
    if (this.isHost) return;
    sb.broadcastToRoom({
      type: 'input',
      playerId: this.playerId,
      input,
    });
  }

  broadcastState(state) {
    if (!this.isHost) return;
    sb.broadcastToRoom({ type: 'state', state });
  }

  startGame() {
    if (!this.isHost) return;
    sb.broadcastToRoom({
      type: 'start',
      players: Object.keys(this.players),
      maxPlayers: this.maxPlayers,
    });
  }

  getRemoteInputs() {
    return this.remoteInputs;
  }

  getPlayerCount() {
    return Object.keys(this.players).length;
  }

  leave() {
    if (this.active) {
      sb.broadcastToRoom({ type: 'leave', playerId: this.playerId });
      sb.leaveRoom();
    }
    this.active = false;
    this.players = {};
    this.remoteInputs = {};
  }
}
