import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { createServer as createViteServer } from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function startServer() {
    const app = express();
    const server = createServer(app);
    const io = new Server(server);

    const isProd = process.env.NODE_ENV === 'production';

    if (!isProd) {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: 'spa'
        });
        app.use(vite.middlewares);
    } else {
        app.use(express.static(resolve(__dirname, 'dist')));
    }

    const PLAYERS = {};
    const BULLETS = [];

    io.on('connection', (socket) => {
        console.log('Player connected:', socket.id);
        
        PLAYERS[socket.id] = { id: socket.id, x: 0, y: 2, z: 0, pitch: 0, yaw: 0, mode: null, hp: 100, weaponId: 'pistol' };
        
        socket.emit('init', { id: socket.id, players: PLAYERS });
        socket.broadcast.emit('playerJoined', PLAYERS[socket.id]);

        socket.on('update', (data) => {
            if (PLAYERS[socket.id]) {
                Object.assign(PLAYERS[socket.id], data);
                socket.broadcast.emit('playerMoved', PLAYERS[socket.id]);
            }
        });

        socket.on('shoot', (data) => {
            // data: { start: {x,y,z}, dir: {x,y,z}, weaponId, hitscan: boolean, endPoint: {x,y,z} }
            socket.broadcast.emit('playerShoot', { id: socket.id, ...data });
        });

        socket.on('hit', (data) => {
            // data: { targetId, damage }
            if (PLAYERS[data.targetId]) {
                PLAYERS[data.targetId].hp -= data.damage;
                io.emit('playerHit', { id: data.targetId, hp: PLAYERS[data.targetId].hp, attackerId: socket.id });
                
                if (PLAYERS[data.targetId].hp <= 0) {
                    io.emit('playerDied', { id: data.targetId, attackerId: socket.id });
                    PLAYERS[data.targetId].hp = 100; // Reset hp for respawn
                }
            }
        });

        socket.on('disconnect', () => {
            console.log('Player disconnected:', socket.id);
            delete PLAYERS[socket.id];
            io.emit('playerLeft', socket.id);
        });
    });

    const port = process.env.PORT || 3000;
    server.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
}

startServer();
