import { io } from 'socket.io-client';
import * as THREE from 'three';
import { scene } from './scene.js';
import { getRoundedBoxGeometry } from './weapons.js';

export let socket;
export let players = {}; 
export let myId = null;

const playerMat = new THREE.MeshLambertMaterial({ color: 0xff4444 });
const headGeo = new THREE.BoxGeometry(1, 1, 1);
const bodyGeo = new THREE.BoxGeometry(1, 1.5, 0.5);

export function getMyId() {
    return myId || (socket ? socket.id : null);
}

export function initMultiplayer() {
    socket = io();

    socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
    });

    socket.on('init', (data) => {
        myId = data.id;
        for (let id in data.players) {
            if (id !== myId) addPlayer(data.players[id]);
        }
    });

    socket.on('queueUpdate', (queues) => {
        // UI code expects this to update the lobby screen columns
        const evt = new CustomEvent('queueUpdate', { detail: queues });
        window.dispatchEvent(evt);
        // Also store it globally for late listeners
        window.lastQueues = queues;
    });

    socket.on('startDuo', (data) => {
        // We received the paired match
        const evt = new CustomEvent('startDuo', { detail: data });
        window.dispatchEvent(evt);
    });

    socket.on('playerJoined', (data) => {
        if (data.id !== myId) addPlayer(data);
    });

    socket.on('playerMoved', (data) => {
        if (players[data.id]) {
            const p = players[data.id];
            p.mesh.position.set(data.x, data.y, data.z);
            p.mesh.rotation.y = data.yaw;
            p.headObj.rotation.x = data.pitch;
            // Optionally update weapon based on data.weaponId if I build dynamic player meshes
        } else {
            // maybe we missed joined
            addPlayer(data);
        }
    });

    socket.on('playerShoot', (data) => {
        if (data.id === myId) return;
        import('./audio.js').then(a => a.playSound('shoot', data.weaponId));
        if (data.hitscan && data.endPoint) {
            import('./zombies.js').then(z => z.createHitscanTrail(new THREE.Vector3(data.start.x, data.start.y, data.start.z), new THREE.Vector3(data.endPoint.x, data.endPoint.y, data.endPoint.z), 0xffaa00, 0.05));
        } else {
             // bullet spawned 
             import('./constants.js').then(c => {
                 const wStats = c.WEAPONS[data.weaponId] || c.SURVIVAL_WEAPONS[data.weaponId] || c.SURVIVAL_WEAPONS['pistol'];
                 const bMesh = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.5), new THREE.MeshBasicMaterial({ color: new THREE.Color(wStats.color) }));
                 const origin = new THREE.Vector3(data.start.x, data.start.y, data.start.z);
                 const bDir = new THREE.Vector3(data.dir.x, data.dir.y, data.dir.z);
                 bMesh.position.copy(origin).addScaledVector(bDir, 0.5); 
                 bMesh.lookAt(bMesh.position.clone().add(bDir)); scene.add(bMesh);
                 c.state.entities.bullets.push({ mesh: bMesh, dir: bDir, speed: wStats.speed || 100, damage: 0, pierce: 0, hits:[], life: 1.0 }); // damage 0 because local hit reg
             });
        }
    });

    socket.on('playerHit', (data) => {
        if (data.id === myId) {
            import('./constants.js').then(c => {
                c.state.survival.health = data.hp;
                c.state.survival.damageFlashTimer = 0.25;
                import('./ui.js').then(ui => ui.updateSurvivalHUD());
            });
            import('./audio.js').then(a => a.playSound('damage'));
        }
    });

    socket.on('playerDied', (data) => {
        if (data.id === myId) {
            import('./constants.js').then(c => {
               if (c.state.gameMode === 'survival') {
                    c.state.survival.health = 0; 
                    import('./ui.js').then(ui => ui.updateSurvivalHUD()); 
                    c.state.survival.waveState = 'GAMEOVER';
                    document.exitPointerLock(); 
                    document.getElementById('survivalGameOver').style.display = 'flex'; 
               }
            });
             import('./audio.js').then(a => a.playSound('die'));
        } else if (players[data.id]) {
             import('./zombies.js').then(z => z.createParticles(players[data.id].mesh.position, 0xff0000, 15));
        }
    });

    socket.on('playerLeft', (id) => {
        if (players[id]) {
            scene.remove(players[id].mesh);
            delete players[id];
        }
    });
}

function addPlayer(data) {
    if (players[data.id]) return; // already added

    const color = data.colorIndex === 1 ? 0x0000ff : (data.colorIndex === 2 ? 0x00ff00 : 0xff4444);
    const pMat = new THREE.MeshLambertMaterial({ color });

    const group = new THREE.Group();
    group.position.set(data.x, data.y, data.z);
    
    // Head setup so it can pitch up and down
    const headObj = new THREE.Object3D(); 
    headObj.position.y = 1.0; // relative to body center
    
    const headMesh = new THREE.Mesh(headGeo, pMat);
    // Move head mesh slightly so its origin is at the neck
    headObj.add(headMesh);

    // Eyes
    const eyeGeo = new THREE.BoxGeometry(0.2, 0.2, 0.1); 
    const eyeMat = new THREE.MeshBasicMaterial({color: 0x000000});
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat); eyeL.position.set(-0.3, 0, -0.51);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat); eyeR.position.set(0.3, 0, -0.51);
    headMesh.add(eyeL); headMesh.add(eyeR);

    // The body
    const bodyMesh = new THREE.Mesh(bodyGeo, pMat);
    bodyMesh.position.y = 0; 
    
    group.add(bodyMesh);
    group.add(headObj);
    
    // Tag for intersection
    group.userData.playerId = data.id;

    scene.add(group);
    
    // give them a bounding radius for hit detection (height=2.5 now -> head=1 + body=1.5)
    players[data.id] = { id: data.id, mesh: group, headObj, radius: 0.8, height: 2.5 };
}
