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
    const queues = { tester: {}, survival: {} };

    io.on('connection', (socket) => {
        console.log('Player connected:', socket.id);
        
        PLAYERS[socket.id] = { id: socket.id, x: 0, y: 2, z: 0, pitch: 0, yaw: 0, mode: null, hp: 100, weaponId: 'pistol', room: socket.id, colorIndex: 0 };
        socket.join(socket.id); // Default solo room
        
        socket.emit('init', { id: socket.id, players: PLAYERS });
        socket.emit('queueUpdate', queues);
        // Wait, playerJoined should only be sent to the same room. We will send it later when joining a room.

        socket.on('joinQueue', (data) => {
            // data: { mode: 'tester' | 'survival', name: string }
            if (queues.tester[socket.id]) delete queues.tester[socket.id];
            if (queues.survival[socket.id]) delete queues.survival[socket.id];
            
            queues[data.mode][socket.id] = data.name || 'Anonymous';
            io.emit('queueUpdate', queues);
        });

        socket.on('leaveQueue', () => {
            delete queues.tester[socket.id];
            delete queues.survival[socket.id];
            io.emit('queueUpdate', queues);
        });

        socket.on('joinDuo', (data) => {
            // data: { targetId, mode }
            const targetId = data.targetId;
            if (queues[data.mode] && queues[data.mode][targetId]) {
                // Remove both from queue
                delete queues.tester[targetId];
                delete queues.survival[targetId];
                delete queues.tester[socket.id];
                delete queues.survival[socket.id];
                io.emit('queueUpdate', queues);

                const roomName = 'duo_' + Date.now();
                socket.join(roomName);
                
                // Use safer joining for target
                const targetSocket = io.sockets.sockets.get(targetId);
                if (targetSocket) {
                    targetSocket.join(roomName);
                    // Tell both players game is starting
                    io.to(roomName).emit('startDuo', { mode: data.mode, room: roomName, players: [targetId, socket.id] });
                    
                    PLAYERS[targetId].room = roomName;
                    PLAYERS[targetId].colorIndex = 1; 
                    PLAYERS[targetId].mode = data.mode;
                    
                    PLAYERS[socket.id].room = roomName;
                    PLAYERS[socket.id].colorIndex = 2;
                    PLAYERS[socket.id].mode = data.mode;

                    // Tell each other they joined
                    io.to(roomName).emit('playerJoined', PLAYERS[targetId]);
                    io.to(roomName).emit('playerJoined', PLAYERS[socket.id]);
                }
            }
        });

        socket.on('update', (data) => {
            if (PLAYERS[socket.id]) {
                const room = PLAYERS[socket.id].room;
                Object.assign(PLAYERS[socket.id], data);
                socket.to(room).emit('playerMoved', PLAYERS[socket.id]);
            }
        });

        socket.on('shoot', (data) => {
            const room = PLAYERS[socket.id] ? PLAYERS[socket.id].room : socket.id;
            socket.to(room).emit('playerShoot', { id: socket.id, ...data });
        });

        socket.on('hit', (data) => {
            if (PLAYERS[data.targetId]) {
                const room = PLAYERS[socket.id] ? PLAYERS[socket.id].room : socket.id;
                PLAYERS[data.targetId].hp -= data.damage;
                io.to(room).emit('playerHit', { id: data.targetId, hp: PLAYERS[data.targetId].hp, attackerId: socket.id });
                
                if (PLAYERS[data.targetId].hp <= 0) {
                    io.to(room).emit('playerDied', { id: data.targetId, attackerId: socket.id });
                    PLAYERS[data.targetId].hp = 100; // Reset hp for respawn
                }
            }
        });

        socket.on('disconnect', () => {
            console.log('Player disconnected:', socket.id);
            const room = PLAYERS[socket.id] ? PLAYERS[socket.id].room : socket.id;
            delete PLAYERS[socket.id];
            delete queues.tester[socket.id];
            delete queues.survival[socket.id];
            io.emit('queueUpdate', queues);
            socket.to(room).emit('playerLeft', socket.id);
        });
    });

    const port = process.env.PORT || 3000;
    server.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
}

startServer();
