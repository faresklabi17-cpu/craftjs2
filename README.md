# CraftJS — Minecraft dans le navigateur

Un clone Minecraft complet jouable directement dans le navigateur, avec support multijoueur via WebSocket.

---

## 🗂 Structure

```
craftjs/
├── craftjs.html    ← Le jeu complet (client)
├── server.js       ← Serveur multijoueur Node.js
└── README.md
```

---

## 🚀 Lancement rapide

### Mode Solo
1. Ouvrez simplement `craftjs.html` dans votre navigateur
2. Entrez un pseudo
3. Cliquez **MODE SOLO**
4. Cliquez sur le canvas pour capturer la souris → jouez !

---

### Mode Multijoueur

#### 1. Installer Node.js
Téléchargez depuis https://nodejs.org (v16+ recommandé)

#### 2. Installer les dépendances
```bash
npm install ws
```

#### 3. Lancer le serveur
```bash
node server.js
# Ou sur un port personnalisé :
node server.js 8080
```

Vous verrez :
```
🟢 CraftJS Server démarré sur ws://localhost:3000
```

#### 4. Ouvrir le jeu
- Ouvrez `craftjs.html` dans votre navigateur
- Entrez votre pseudo
- L'URL serveur par défaut est `ws://localhost:3000` (changez si besoin)
- Cliquez **MULTIJOUEUR**

#### 5. Plusieurs joueurs sur le même réseau local
- Trouvez votre IP locale : `ipconfig` (Windows) / `ifconfig` (Linux/Mac)
- Les autres joueurs entrent `ws://VOTRE_IP:3000` dans le champ serveur

---

## 🎮 Contrôles

| Touche | Action |
|--------|--------|
| Z/Q/S/D ou W/A/S/D | Déplacement |
| Espace | Sauter |
| Shift | Sprint |
| Clic gauche (maintenu) | Casser un bloc |
| Clic droit | Poser un bloc |
| 1–9 | Sélectionner slot hotbar |
| Molette souris | Changer bloc sélectionné |
| Échap | Pause / Menu |

---

## ✨ Fonctionnalités

### Terrain
- **Génération procédurale** avec bruit de Perlin multi-octave
- **3 biomes** : plaines, montagnes, forêts
- **Arbres** générés automatiquement
- **Eau** dans les zones basses (niveau de la mer)
- **Neige** sur les sommets élevés
- Système de **chunks 16×16** avec chargement dynamique

### Gameplay
- Vue **FPS** avec mouvement fluide
- **Gravité et collision** réalistes
- **Casser les blocs** (durée variable selon le type)
- **Poser les blocs** (clic droit)
- **9 types de blocs** en hotbar : Herbe, Terre, Pierre, Sable, Bois, Feuilles, Cobblestone, Brique, Verre

### Graphismes
- **Cycle jour/nuit** avec couleurs de ciel dynamiques (lever/coucher de soleil)
- **Lumière directionnelle** (soleil) + lumière ambiante
- **Ombres** dynamiques
- **Brouillard** de distance
- **Étoiles** la nuit
- **Textures pixelisées** générées via Canvas

### Interface
- **HUD** complet : vie, hotbar, crosshair
- **Mini-carte** topographique en temps réel
- **Barre de cassage** de bloc
- **Affichage heure** du jeu (cycle 24h)
- **Debug** : FPS, coordonnées, chunk, nb joueurs

### Sons
- Sons synthétisés via **Web Audio API** (pas de fichiers audio nécessaires)
- Sons de pas, de cassage et de pose de blocs

### Multijoueur
- **Synchronisation positions** des joueurs en temps réel (50ms)
- **Avatars 3D** des autres joueurs avec nom affiché
- **Synchronisation des blocs** cassés/posés
- Persistance des modifications sur le serveur (session)
- Anti-cheat basique (validation déplacement)

---

## ⚙️ Options du serveur

```bash
# Port personnalisé
node server.js 8080

# Avec PM2 (production)
npm install -g pm2
pm2 start server.js --name craftjs
pm2 logs craftjs
```

---

## 🔧 Dépannage

**Le pointer lock ne fonctionne pas**
→ Cliquez directement sur le canvas. Certains navigateurs bloquent en iframe.

**Pas de connexion multijoueur**
→ Vérifiez que `node server.js` tourne. Vérifiez votre firewall (port 3000).

**Performances basses**
→ Fermez les autres onglets. Réduisez la fenêtre. Chrome/Edge sont plus rapides que Firefox pour WebGL.

**Terrain ne se charge pas**
→ Attendez 1-2 secondes. La génération initiale prend un moment.

---

## 🗺️ Architecture technique

```
craftjs.html
├── Noise          — Perlin noise (implémentation standalone)
├── BLOCKS         — Définition des types de blocs
├── World          — Gestion chunks, génération terrain, mesh 3D
├── Player         — FPS controller, collisions, interactions
├── MultiplayerClient — WebSocket client
├── Minimap        — Rendu mini-carte canvas 2D
├── UI             — HUD, hotbar, notifications
└── Game           — Boucle principale, cycle jour/nuit, sons

server.js
├── Gestion connexions WebSocket
├── Synchronisation positions joueurs
├── Persistance des modifications de blocs (session)
└── Broadcast optimisé (tick 50ms)
```
