// ── Supabase Configuration ──
// Replace these with your Supabase project credentials
const SUPABASE_URL = 'https://njrdbpwgmhugwguykupr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qcmRicHdnbWh1Z3dndXlrdXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5OTAxNTMsImV4cCI6MjA4NjU2NjE1M30.peK6tQK0lafVAlmoh9OHi6WY2VGa_6mutTYfeJevAig';

let client = null;

function getClient() {
  if (client) return client;
  if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || !window.supabase) return null;
  client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return client;
}

export function isConfigured() {
  return SUPABASE_URL !== 'YOUR_SUPABASE_URL' && !!window.supabase;
}

// ── Messages ──

export async function sendMessage(content) {
  const sb = getClient();
  if (!sb) return false;
  const { error } = await sb.from('messages').insert({ content });
  return !error;
}

// ── Leaderboard ──

export async function submitScore(name, score, level, mode) {
  const sb = getClient();
  if (!sb) return false;
  const { error } = await sb.from('scores').insert({ name, score, level, mode });
  return !error;
}

export async function getLeaderboard(mode) {
  const sb = getClient();
  if (!sb) return [];
  const { data, error } = await sb
    .from('scores')
    .select('name, score, level, mode, created_at')
    .eq('mode', mode)
    .order('score', { ascending: false })
    .limit(20);
  if (error) return [];
  return data;
}

// ── Multiplayer Realtime ──

let currentChannel = null;

export function createRoom(roomCode, onMessage) {
  const sb = getClient();
  if (!sb) return null;
  currentChannel = sb.channel(`room:${roomCode}`, {
    config: { broadcast: { self: false } },
  });
  currentChannel.on('broadcast', { event: 'game' }, (payload) => {
    onMessage(payload.payload);
  });
  currentChannel.subscribe();
  return currentChannel;
}

export function joinRoom(roomCode, onMessage) {
  return createRoom(roomCode, onMessage);
}

export function broadcastToRoom(data) {
  if (!currentChannel) return;
  currentChannel.send({
    type: 'broadcast',
    event: 'game',
    payload: data,
  });
}

export function leaveRoom() {
  if (currentChannel) {
    currentChannel.unsubscribe();
    currentChannel = null;
  }
}
