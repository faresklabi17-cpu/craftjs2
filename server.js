/**
 * CraftJS — Serveur Multijoueur
 * Node.js + ws (WebSocket)
 *
 * Usage :
 *   npm install ws
 *   node server.js [PORT]
 */

const WebSocket = require('ws');
const PORT = process.argv[2] || 3000;

const wss = new WebSocket.Server({ port: PORT });
console.log(`🟢 CraftJS Server démarré sur ws://localhost:${PORT}`);

// État global
let nextId = 1;
const players = new Map();   // id -> { ws, name, pos, yaw }
const blocks   = new Map();  // "x,y,z" -> value (modifications joueurs)

// Broadcast à tous sauf l'expéditeur
function broadcast(data, excludeId = null) {
  const msg = JSON.stringify(data);
  for (const [id, p] of players.entries()) {
    if (id !== excludeId && p.ws.readyState === WebSocket.OPEN) {
      p.ws.send(msg);
    }
  }
}

// Broadcast à tous
function broadcastAll(data) {
  const msg = JSON.stringify(data);
  for (const p of players.values()) {
    if (p.ws.readyState === WebSocket.OPEN) p.ws.send(msg);
  }
}

wss.on('connection', (ws) => {
  const id = nextId++;
  let player = null;

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.type) {

      // ── Connexion ──────────────────────────────────
      case 'join': {
        const name = (msg.name || 'Joueur').substring(0, 16).replace(/[<>]/g, '');
        player = { ws, id, name, pos: { x: 8, y: 40, z: 8 }, yaw: 0 };
        players.set(id, player);

        console.log(`[+] ${name} (id=${id}) connecté — ${players.size} joueur(s)`);

        // Message de bienvenue + liste blocs modifiés
        const blocklist = [];
        for (const [key, v] of blocks.entries()) {
          const [x, y, z] = key.split(',').map(Number);
          blocklist.push({ x, y, z, v });
        }
        ws.send(JSON.stringify({
          type: 'welcome',
          id,
          blocks: blocklist
        }));

        // Envoyer liste des joueurs actuels au nouveau
        const currentPlayers = [];
        for (const [pid, p] of players.entries()) {
          if (pid !== id) currentPlayers.push({ id: pid, name: p.name, pos: p.pos, yaw: p.yaw });
        }
        ws.send(JSON.stringify({ type: 'players', players: currentPlayers }));

        // Annoncer aux autres
        broadcast({ type: 'player_join', id, name, pos: player.pos }, id);
        break;
      }

      // ── Mouvement ──────────────────────────────────
      case 'move': {
        if (!player) return;
        if (msg.pos) {
          // Validation basique anti-cheat
          const dx = msg.pos.x - player.pos.x;
          const dy = msg.pos.y - player.pos.y;
          const dz = msg.pos.z - player.pos.z;
          const dist = Math.sqrt(dx*dx+dy*dy+dz*dz);
          if (dist < 20) { // max ~20 blocs/tick (ping élevé toléré)
            player.pos = msg.pos;
            player.yaw = msg.yaw || 0;
          }
        }
        broadcast({ type: 'player_move', id, pos: player.pos, yaw: player.yaw }, id);
        break;
      }

      // ── Bloc cassé/posé ────────────────────────────
      case 'block': {
        if (!player) return;
        const { x, y, z, v } = msg;
        // Validation coordonnées
        if (typeof x !== 'number' || typeof y !== 'number' || typeof z !== 'number') return;
        if (y < 0 || y > 128) return;

        const key = `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
        if (v === 0) blocks.delete(key);
        else blocks.set(key, v);

        console.log(`  [bloc] ${player.name}: (${x},${y},${z}) => ${v}`);
        broadcast({ type: 'block_set', x: Math.floor(x), y: Math.floor(y), z: Math.floor(z), v }, id);
        break;
      }

      // ── Chat ───────────────────────────────────────
      case 'chat': {
        if (!player) return;
        const text = (msg.text || '').substring(0, 120).replace(/[<>]/g, '');
        console.log(`  [chat] ${player.name}: ${text}`);
        broadcastAll({ type: 'chat', name: player.name, text });
        break;
      }
    }
  });

  ws.on('close', () => {
    if (!player) return;
    players.delete(id);
    console.log(`[-] ${player.name} déconnecté — ${players.size} joueur(s)`);
    broadcast({ type: 'player_leave', id, name: player.name });
  });

  ws.on('error', (err) => {
    console.error(`[!] Erreur WS id=${id}:`, err.message);
  });
});

// Tick serveur : envoyer positions toutes les 50ms à tous
setInterval(() => {
  if (players.size < 2) return;
  for (const [id, p] of players.entries()) {
    const others = [];
    for (const [oid, op] of players.entries()) {
      if (oid !== id) others.push({ id: oid, pos: op.pos, yaw: op.yaw });
    }
    if (p.ws.readyState === WebSocket.OPEN) {
      p.ws.send(JSON.stringify({ type: 'player_move_batch', players: others }));
    }
  }
}, 50);

// Infos console toutes les 30s
setInterval(() => {
  if (players.size > 0)
    console.log(`[info] ${players.size} joueur(s) connecté(s), ${blocks.size} blocs modifiés`);
}, 30000);
