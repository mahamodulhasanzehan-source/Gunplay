import * as THREE from 'three';
import { state, WAVE_CONFIGS } from './constants.js';
import { scene, camera, renderer, yawObj, cameraRecoilObj, viewmodel, stationPos, stationMesh, raycaster } from './scene.js';
import { getActiveWeaponId, getActiveWeaponStats, updateSurvivalHUD } from './ui.js';
import { buildWeaponMesh, currentWeaponMesh } from './weapons.js';
import { playSound } from './audio.js';
import { spawnZombies, spawnSurvivalZombies, createFloatingText, createParticles, createHitscanTrail } from './zombies.js';
import { socket, players } from './multiplayer.js';

export const clock = new THREE.Clock();
let lastEmit = 0;

function isPlayerMesh(obj) {
    if (obj.userData && obj.userData.playerId) return true;
    if (obj.parent) return isPlayerMesh(obj.parent);
    return false;
}

function getPlayerIdFromMesh(obj) {
    if (obj.userData && obj.userData.playerId) return obj.userData.playerId;
    if (obj.parent) return getPlayerIdFromMesh(obj.parent);
    return null;
}

export function update() {
    const delta = Math.min(clock.getDelta(), 0.1); 
    if (!state.gameMode || state.menuOpen || state.paused) return;

    let inputDir = new THREE.Vector3();
    inputDir.z = Number(state.keys['s'] || 0) - Number(state.keys['w'] || 0);
    inputDir.x = Number(state.keys['d'] || 0) - Number(state.keys['a'] || 0);
    inputDir.normalize();

    let isRunning = state.keys['shift'] && inputDir.lengthSq() > 0;
    
    if (!state.keys['c']) {
        state.player.slideLock = false; 
    }

    if (state.keys['c'] && isRunning && !state.player.sliding && state.player.velocity.y === 0 && !state.player.slideLock) {
        state.player.sliding = true;
        state.player.slideTime = state.gameMode === 'survival' ? 0.75 : 3.0;
        state.player.slideDir = inputDir.clone();
    }

    let speedMultiplier = state.player.ads ? 5 : (state.keys['shift'] ? 20 : 10);
    
    if (state.player.sliding) {
        if (!state.keys['c'] || state.player.slideTime <= 0) {
            state.player.sliding = false; 
            state.player.slideLock = true; 
        } else {
            state.player.slideTime -= delta;
            speedMultiplier = 40; inputDir.copy(state.player.slideDir); 
        }
    }

    state.player.direction.copy(inputDir);

    if (state.player.direction.z !== 0 || state.player.direction.x !== 0) {
        const dir = state.player.direction.clone(); dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), yawObj.rotation.y);
        state.player.velocity.x = THREE.MathUtils.lerp(state.player.velocity.x, dir.x * speedMultiplier, delta * 15);
        state.player.velocity.z = THREE.MathUtils.lerp(state.player.velocity.z, dir.z * speedMultiplier, delta * 15);
    } else { state.player.velocity.x *= 0.8; state.player.velocity.z *= 0.8; }

    const targetGroundHeight = state.player.sliding ? 1.0 : 2.0;

    if (state.keys[' '] && yawObj.position.y <= targetGroundHeight + 0.05 && !state.player.sliding) {
        state.player.velocity.y = 15; playSound('jump');
    }

    state.player.velocity.y -= 40 * delta; 
    yawObj.position.x += state.player.velocity.x * delta; yawObj.position.z += state.player.velocity.z * delta; yawObj.position.y += state.player.velocity.y * delta;

    if (yawObj.position.y < targetGroundHeight) {
        yawObj.position.y = THREE.MathUtils.lerp(yawObj.position.y, targetGroundHeight, delta * 15);
        if (targetGroundHeight - yawObj.position.y < 0.05) yawObj.position.y = targetGroundHeight;
        if (state.player.velocity.y < 0) state.player.velocity.y = 0;
    }

    // Invisible Map Barrier Logic - Floor grid is exactly -100 to 100 
    if (state.gameMode === 'survival') {
        yawObj.position.x = Math.max(-99.5, Math.min(99.5, yawObj.position.x));
        yawObj.position.z = Math.max(-99.5, Math.min(99.5, yawObj.position.z));
    }

    stationMesh.rotation.y += delta;
    const distToStation = yawObj.position.distanceTo(stationPos);
    const prompt = document.getElementById('interactionPrompt');
    if (distToStation < 5) {
        prompt.style.display = 'block';
        prompt.innerText = state.gameMode === 'survival' ? "Press [F] to Open Buy Station" : "Press [F] to Open Armory";
    } else prompt.style.display = 'none';

    const activeId = getActiveWeaponId();
    const wStats = getActiveWeaponStats();
    const isSniper = state.gameMode === 'tester' && (activeId === 'dlq33' || activeId === 'lw3_tundra');
    
    let targetFov = 75;
    if (state.player.ads) {
        if (isSniper) targetFov = 20; else if (activeId === 'sks') targetFov = 40; else targetFov = 60;
    }
    camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, delta * 15); camera.updateProjectionMatrix();

    if (state.player.ads && isSniper && camera.fov < 35) {
        if (currentWeaponMesh) currentWeaponMesh.visible = false;
        document.getElementById('scopeOverlay').style.display = 'block'; document.getElementById('crosshair').style.display = 'none';
    } else {
        if (currentWeaponMesh) currentWeaponMesh.visible = true;
        document.getElementById('scopeOverlay').style.display = 'none'; document.getElementById('crosshair').style.display = 'block';
    }
    
    if (state.gameMode === 'survival') {
        if (state.survival.reloading) document.getElementById('crosshair').style.opacity = '0.3';
        else document.getElementById('crosshair').style.opacity = '1';
    }

    const targetViewX = state.player.ads && !isSniper ? 0 : 0.3;
    let targetViewY = state.player.ads && !isSniper ? -0.2 : -0.25;
    if (state.player.ads && activeId === 'm8a1') targetViewY = -0.31; 
    const targetViewZ = state.player.ads && !isSniper ? -0.4 : -0.5;

    const modeIdx = state.player.weaponMode || 0;
    const activeMode = wStats.modes ? wStats.modes[modeIdx] : wStats;
    const rpm = activeMode.rpm || wStats.rpm;
    const currentDamage = activeMode.damage || wStats.damage;
    const fireType = activeMode.type || wStats.type || 'auto';
    const now = Date.now();
    const cooldown = 60000 / rpm;

    let canShoot = false;
    let inv = null;

    if (state.gameMode === 'survival') {
        inv = state.survival.inventory[state.survival.activeType];
        if (state.survival.reloading) {
            if (now >= state.survival.reloadTimer) {
                state.survival.reloading = false;
                let needed = wStats.mag - inv.mag; let take = Math.min(needed, inv.reserve);
                inv.mag += take; inv.reserve -= take; updateSurvivalHUD();
            }
        } else {
            if (inv.mag > 0) {
                if (fireType === 'semi') {
                    if (state.mouseJustPressed && now - state.player.lastShot > cooldown) { canShoot = true; state.player.lastShot = now; inv.mag--; }
                } else {
                    if (state.mouse && now - state.player.lastShot > cooldown) { canShoot = true; state.player.lastShot = now; inv.mag--; }
                }
                if (canShoot) updateSurvivalHUD();
                if (inv.mag <= 0 && inv.reserve > 0) {
                    import('./ui.js').then(module => module.startReload());
                }
            } else if (state.mouseJustPressed && inv.reserve === 0) {
                playSound('empty_mag');
            }
        }
    } else {
        if (fireType === 'burst') {
            if (state.mouse && state.player.burstsRemaining === 0 && now > state.player.burstCooldownEnd) {
                state.player.burstsRemaining = activeMode.burst || 4; state.player.burstNextShotTime = now;
            }
            if (state.player.burstsRemaining > 0 && now >= state.player.burstNextShotTime) {
                canShoot = true; state.player.burstsRemaining--; state.player.burstNextShotTime = now + cooldown;
                if (state.player.burstsRemaining === 0) state.player.burstCooldownEnd = now + (activeMode.delay || 150);
            }
        } else if (fireType === 'semi') {
            if (state.mouseJustPressed && now - state.player.lastShot > cooldown) { canShoot = true; state.player.lastShot = now; }
        } else {
            if (state.mouse && now - state.player.lastShot > cooldown) { canShoot = true; state.player.lastShot = now; }
        }
    }

    if (canShoot) {
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.getWorldQuaternion(new THREE.Quaternion()));
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.getWorldQuaternion(new THREE.Quaternion()));
        let spreadAngles = [[0,0]];
        
        if (wStats.special === 'shotgun_horizontal') {
            spreadAngles =[]; for(let p=0; p<135; p++) spreadAngles.push([(Math.random()-0.5)*0.25, (Math.random()-0.5)*0.05]);
        }
        if (wStats.special === 'spread_horizontal') spreadAngles = [[0,0],[0.03,0],[-0.03,0],[0.06,0],[-0.06,0]];

        let camPitchKick = 0; let camYawKick = 0; let wepZKick = 0; let wepPitchKick = 0;
        if (wStats.id === 'mosquito') wepZKick = 0.05; 
        else if (isSniper) { camPitchKick = 0.08; camYawKick = (Math.random() - 0.5) * 0.02; wepZKick = 0.6; wepPitchKick = 0.5; } 
        else {
            const kickMod = (currentDamage / 10) + (10 / (rpm / 60));
            camPitchKick = 0.005 * kickMod; camYawKick = (Math.random() - 0.5) * 0.004 * kickMod;
            wepZKick = 0.25 * kickMod; wepPitchKick = 0.20 * kickMod;  
        }

        if (state.player.ads) { camPitchKick *= 0.6; camYawKick *= 0.6; wepZKick *= 0.05; wepPitchKick *= 0.05; }
        state.recoil.targetCamPitch += camPitchKick; state.recoil.targetCamYaw += camYawKick;
        state.recoil.targetWepZ += wepZKick; state.recoil.targetWepPitch += wepPitchKick;

        state.recoil.targetCamPitch = Math.min(state.recoil.targetCamPitch, 0.25);
        state.recoil.targetWepZ = Math.min(state.recoil.targetWepZ, 1.2);
        state.recoil.targetWepPitch = Math.min(state.recoil.targetWepPitch, 1.0);

        (rpm / 60) > 10 ? playSound('shoot_fast', wStats.id) : playSound('shoot', wStats.id);

        const camDir = new THREE.Vector3(); camera.getWorldDirection(camDir);
        const rayOrigin = new THREE.Vector3(); camera.getWorldPosition(rayOrigin);
        let visualStart = new THREE.Vector3();
        if (currentWeaponMesh && currentWeaponMesh.visible) {
            currentWeaponMesh.getWorldPosition(visualStart); visualStart.add(camDir.clone().multiplyScalar(0.8)); 
        } else { visualStart.copy(rayOrigin); visualStart.y -= 0.1; }

        const getHittableMeshes = () => {
            let meshes =[]; 
            state.entities.zombies.forEach(z => { z.mesh.traverse(child => { if(child.isMesh) meshes.push(child); }); });
            for (let pid in players) {
                players[pid].mesh.traverse(child => { if(child.isMesh) meshes.push(child); });
            }
            return meshes;
        };

        spreadAngles.forEach(ang => {
            const bDir = camDir.clone();
            bDir.add(right.clone().multiplyScalar(ang[0] + (Math.random()-0.5)*0.005));
            bDir.add(up.clone().multiplyScalar(ang[1] + (Math.random()-0.5)*0.005));
            bDir.normalize();

            if (wStats.hitscan) {
                raycaster.set(rayOrigin, bDir);
                const intersections = raycaster.intersectObjects(getHittableMeshes(), true);
                
                let endPoint = rayOrigin.clone().addScaledVector(bDir, 200); 
                let hits =[]; let hitSet = new Set();
                let playerHits = []; // multiplayer

                for (let hit of intersections) {
                    let obj = hit.object; while(obj && !obj.userData.zombieData && !isPlayerMesh(obj)) obj = obj.parent;
                    if (obj && obj.userData.zombieData) {
                        const z = obj.userData.zombieData;
                        if (!hitSet.has(z) && !z.isDead) { hitSet.add(z); hits.push({ zombie: z, point: hit.point }); }
                    } else if (obj && isPlayerMesh(obj)) {
                        const pid = getPlayerIdFromMesh(obj);
                        if (pid && !hitSet.has(pid)) {
                            hitSet.add(pid); playerHits.push({ id: pid, point: hit.point });
                        }
                    }
                }

                let pierceCount = 0;
                let actualPierce = wStats.pierce;
                if (state.gameMode === 'survival' && wStats.pierceChance > 0) {
                    if (Math.random() * 100 <= wStats.pierceChance) actualPierce++;
                }

                for (let h of hits) {
                    const z = h.zombie;
                    let isHeadshot = false;
                    if (z.type === 'purple' || z.type === 'tall' || (z.userData && z.height > 2)) {
                        if (h.point.y > z.mesh.position.y + z.height/6) isHeadshot = true;
                    }

                    const finalDmg = isHeadshot ? currentDamage * 1.2 : currentDamage;
                    z.hp -= finalDmg;
                    
                    createParticles(h.point, isHeadshot ? 0xff0000 : 0xffffff, isHeadshot ? 8 : 3);
                    z.mesh.traverse(c => { if(c.isMesh && c.material.emissive) c.material.emissive.setHex(0x555555); });
                    setTimeout(() => { if(z.mesh) z.mesh.traverse(c => { if(c.isMesh && c.material.emissive) c.material.emissive.setHex(0x000000); }); }, 50);

                    if (z.hp <= 0) {
                        z.isDead = true; playSound('die');
                        createParticles(z.mesh.position, z.mesh.material ? z.mesh.material.color.getHex() : 0xbf00ff, 15);
                        state.gameplay.lastZType = z.type; scene.remove(z.mesh);
                        
                        const idx = state.entities.zombies.indexOf(z);
                        if (idx > -1) state.entities.zombies.splice(idx, 1);
                        
                        if (state.gameMode === 'survival') {
                            state.survival.money += z.userData.money; state.survival.zombiesKilledThisWave++;
                            state.survival.zombiesKilledThisPhase++; state.survival.activeZombies--;
                            updateSurvivalHUD(); createFloatingText(z.mesh.position, `+$${z.userData.money}`, 0x27ae60);
                        } else {
                            state.gameplay.kills++; document.getElementById('hudZombieCount').innerText = state.gameplay.kills;
                            if (state.gameplay.spawns) spawnZombies(Math.random() < state.gameplay.prob ? 2 : 1);
                        }
                    } else playSound('hit');

                    pierceCount++;
                    if (pierceCount >= actualPierce) { endPoint = h.point; break; }
                }
                
                for (let ph of playerHits) {
                    if (socket) {
                        socket.emit('hit', { targetId: ph.id, damage: currentDamage });
                        createParticles(ph.point, 0xff0000, 3);
                        playSound('hit');
                    }
                    pierceCount++;
                    if (pierceCount >= actualPierce) { endPoint = ph.point; break; }
                }

                if (socket) {
                    socket.emit('shoot', {
                        start: { x: visualStart.x, y: visualStart.y, z: visualStart.z },
                        dir: { x: bDir.x, y: bDir.y, z: bDir.z },
                        weaponId: activeId,
                        hitscan: true,
                        endPoint: { x: endPoint.x, y: endPoint.y, z: endPoint.z }
                    });
                }
                
                createHitscanTrail(visualStart, endPoint, wStats.color, wStats.id === 'mosquito' ? 0.3 : 0.05);
            } else {
                if (socket) {
                    socket.emit('shoot', {
                        start: { x: rayOrigin.x, y: rayOrigin.y, z: rayOrigin.z },
                        dir: { x: bDir.x, y: bDir.y, z: bDir.z },
                        weaponId: activeId,
                        hitscan: false
                    });
                }
                const bMesh = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.5), new THREE.MeshBasicMaterial({ color: new THREE.Color(wStats.color) }));
                bMesh.position.copy(rayOrigin).addScaledVector(bDir, 0.5); bMesh.lookAt(bMesh.position.clone().add(bDir)); scene.add(bMesh);
                state.entities.bullets.push({ mesh: bMesh, dir: bDir, speed: wStats.speed || 100, damage: currentDamage, pierce: wStats.pierce, hits:[], life: 1.0 });
            }
        });
    }
    
    state.mouseJustPressed = false;

    const r = state.recoil;
    r.targetCamPitch = THREE.MathUtils.lerp(r.targetCamPitch, 0, delta * 10); r.targetCamYaw = THREE.MathUtils.lerp(r.targetCamYaw, 0, delta * 10);
    r.targetWepZ = THREE.MathUtils.lerp(r.targetWepZ, 0, delta * 12); r.targetWepPitch = THREE.MathUtils.lerp(r.targetWepPitch, 0, delta * 12);

    r.camPitch = THREE.MathUtils.lerp(r.camPitch, r.targetCamPitch, delta * 25); r.camYaw = THREE.MathUtils.lerp(r.camYaw, r.targetCamYaw, delta * 25);
    r.wepZ = THREE.MathUtils.lerp(r.wepZ, r.targetWepZ, delta * 25); r.wepPitch = THREE.MathUtils.lerp(r.wepPitch, r.targetWepPitch, delta * 25);

    cameraRecoilObj.rotation.x = r.camPitch; cameraRecoilObj.rotation.y = r.camYaw;
    if (currentWeaponMesh) {
        viewmodel.position.x = THREE.MathUtils.lerp(viewmodel.position.x, targetViewX, delta * 15);
        viewmodel.position.y = THREE.MathUtils.lerp(viewmodel.position.y, targetViewY + (r.wepZ * 0.1), delta * 15);
        viewmodel.position.z = THREE.MathUtils.lerp(viewmodel.position.z, targetViewZ + r.wepZ, delta * 15);
        viewmodel.rotation.x = r.wepPitch;
    }

    for (let i = state.entities.bullets.length - 1; i >= 0; i--) {
        const b = state.entities.bullets[i]; b.mesh.position.addScaledVector(b.dir, b.speed * delta); b.life -= delta;
        let destroyed = b.life <= 0;

        for (let j = state.entities.zombies.length - 1; j >= 0 && !destroyed; j--) {
            const z = state.entities.zombies[j]; if (b.hits.includes(z) || z.isDead) continue;
            const dx = b.mesh.position.x - z.mesh.position.x; const dz = b.mesh.position.z - z.mesh.position.z;
            const yHit = b.mesh.position.y;

            if (Math.sqrt(dx*dx + dz*dz) < z.radius + 0.5 && yHit > 0 && yHit < z.height) {
                b.hits.push(z);
                let isHeadshot = (z.type === 'purple' || z.type === 'tall' || (z.userData && z.height > 2)) && yHit > z.mesh.position.y + z.height/6;

                const finalDmg = isHeadshot ? b.damage * 1.2 : b.damage; z.hp -= finalDmg;
                createParticles(b.mesh.position, isHeadshot ? 0xff0000 : 0xffffff, isHeadshot ? 8 : 3);
                z.mesh.traverse(c => { if(c.isMesh && c.material.emissive) c.material.emissive.setHex(0x555555); });
                setTimeout(() => { if(z.mesh) z.mesh.traverse(c => { if(c.isMesh && c.material.emissive) c.material.emissive.setHex(0x000000); }); }, 50);

                if (z.hp <= 0) {
                    z.isDead = true; playSound('die'); createParticles(z.mesh.position, z.mesh.material ? z.mesh.material.color.getHex() : 0xbf00ff, 15);
                    state.gameplay.lastZType = z.type; scene.remove(z.mesh); state.entities.zombies.splice(j, 1);
                    if (state.gameMode === 'survival') {
                        state.survival.money += z.userData.money; state.survival.zombiesKilledThisWave++;
                        state.survival.zombiesKilledThisPhase++; state.survival.activeZombies--; updateSurvivalHUD();
                        createFloatingText(z.mesh.position, `+$${z.userData.money}`, 0x27ae60);
                    } else {
                        state.gameplay.kills++; document.getElementById('hudZombieCount').innerText = state.gameplay.kills;
                        if (state.gameplay.spawns) spawnZombies(Math.random() < state.gameplay.prob ? 2 : 1);
                    }
                } else playSound('hit');

                if (b.hits.length >= b.pierce) destroyed = true;
            }
        }
        
        // Check player collision
        for (let pid in players) {
            if (destroyed) break;
            const p = players[pid];
            if (b.hits.includes(p.id)) continue;
            
            const dx = b.mesh.position.x - p.mesh.position.x;
            const dz = b.mesh.position.z - p.mesh.position.z;
            const yHit = b.mesh.position.y;
            // Assuming player head is 2 units high, base y is y_pos-1 based on origin but here body origin is 0, so height is from 0 to 2.
            const footY = p.mesh.position.y;
            
            if (Math.sqrt(dx*dx + dz*dz) < p.radius && yHit > footY && yHit < footY + p.height) {
                b.hits.push(p.id);
                if (socket && b.damage > 0) { // damage 0 happens for foreign bullets to avoid double hit applying
                   socket.emit('hit', { targetId: p.id, damage: b.damage });
                   createParticles(b.mesh.position, 0xff0000, 3);
                   playSound('hit');
                }
                if (b.hits.length >= b.pierce) destroyed = true;
            }
        }
        
        if (destroyed) { scene.remove(b.mesh); state.entities.bullets.splice(i, 1); }
    }

    for (let i = state.entities.trails.length - 1; i >= 0; i--) {
        const t = state.entities.trails[i]; t.life -= delta * 10; t.mesh.material.opacity = t.life;
        if (t.life <= 0) { scene.remove(t.mesh); state.entities.trails.splice(i, 1); }
    }

    if (state.gameMode === 'survival') {
        const surv = state.survival;
        if (surv.waveState === 'COUNTDOWN') {
            surv.countdownTimer -= delta;
            document.getElementById('survWaveText').innerText = `Wave Starts in: ${Math.ceil(surv.countdownTimer)}`;
            document.getElementById('survZombiesLeftText').innerText = '';
            if (surv.countdownTimer <= 0) {
                surv.waveState = 'PLAYING'; playSound('waveStart');
                spawnSurvivalZombies(WAVE_CONFIGS[surv.wave].initialSpawn);
            }
        } else if (surv.waveState === 'PLAYING') {
            const waveConf = WAVE_CONFIGS[surv.wave]; const rem = Math.max(0, waveConf.totalZombies - surv.zombiesKilledThisWave);
            document.getElementById('survWaveText').innerText = `Wave: ${surv.wave}`;
            document.getElementById('survZombiesLeftText').innerText = `Zombies Left: ${rem}/${waveConf.totalZombies}`;
            
            if (waveConf.phases && surv.currentPhase < waveConf.phases.length) {
                let pt = waveConf.phases[surv.currentPhase];
                if (surv.zombiesKilledThisPhase >= pt.triggerKills) { spawnSurvivalZombies(pt.spawn); surv.currentPhase++; surv.zombiesKilledThisPhase = 0; }
            }
            if (surv.zombiesKilledThisWave >= waveConf.totalZombies && surv.activeZombies <= 0) {
                if (surv.wave < Object.keys(WAVE_CONFIGS).length) {
                    playSound('waveEnd'); surv.wave++; surv.zombiesKilledThisWave = 0; surv.zombiesKilledThisPhase = 0;
                    surv.currentPhase = 0; surv.countdownTimer = 5; surv.waveState = 'COUNTDOWN';
                } else {
                    playSound('waveEnd'); surv.waveState = 'VICTORY'; document.exitPointerLock(); document.getElementById('survivalVictory').style.display = 'flex';
                }
            }
        }

        if (surv.damageFlashTimer > 0) {
            surv.damageFlashTimer -= delta; document.getElementById('survivalHud').style.backgroundColor = `rgba(255, 0, 0, ${surv.damageFlashTimer * 2})`;
        } else document.getElementById('survivalHud').style.backgroundColor = 'transparent';
    }

    state.entities.zombies.forEach(z => {
        const targetDir = new THREE.Vector3().subVectors(yawObj.position, z.mesh.position); targetDir.y = 0; 
        const distToPlayer = targetDir.length(); targetDir.normalize();

        let canMove = true;
        if (state.gameMode === 'survival' && z.userData) {
            if (Date.now() < z.userData.stunnedUntil) canMove = false;
            
            if (distToPlayer < z.radius + 1.5 && canMove) {
                if (Date.now() - z.userData.lastHitTime > z.userData.cooldown * 1000) {
                    z.userData.lastHitTime = Date.now();
                    let dmg = z.userData.dmg; if (Math.random() * 100 <= z.userData.dmgChance) dmg += z.userData.bonusDmg;
                    state.survival.health -= dmg; playSound('damage'); state.survival.damageFlashTimer = 0.25; updateSurvivalHUD();
                    
                    if (state.survival.health <= 0) {
                        state.survival.health = 0; updateSurvivalHUD(); state.survival.waveState = 'GAMEOVER';
                        document.exitPointerLock(); document.getElementById('survivalGameOver').style.display = 'flex'; playSound('die');
                    }
                    
                    if (z.userData.blitz) z.userData.stunnedUntil = Date.now() + 2000;
                    else if (z.speed >= 20) z.userData.stunnedUntil = Date.now() + 1000;
                }
            }
        }

        if (distToPlayer > z.radius + 0.8 && canMove) {
            z.mesh.position.addScaledVector(targetDir, z.speed * delta);
            
            // Clamp zombies to boundary forcefully if in Survival Mode
            if (state.gameMode === 'survival') {
                z.mesh.position.x = Math.max(-98, Math.min(98, z.mesh.position.x));
                z.mesh.position.z = Math.max(-98, Math.min(98, z.mesh.position.z));
            }
        }
        z.mesh.lookAt(yawObj.position.x, z.mesh.position.y, yawObj.position.z);
    });

    for (let i = state.entities.particles.length - 1; i >= 0; i--) {
        const p = state.entities.particles[i]; p.mesh.position.addScaledVector(p.velocity, delta); p.velocity.y -= 20 * delta; p.life -= delta * 2; p.mesh.material.opacity = p.life;
        if (p.life <= 0 || p.mesh.position.y < 0) { scene.remove(p.mesh); state.entities.particles.splice(i, 1); }
    }

    for (let i = state.entities.floatingTexts.length - 1; i >= 0; i--) {
        const ft = state.entities.floatingTexts[i]; ft.life -= delta * 0.8; ft.pos.y += delta * 2;
        if (ft.life <= 0) { ft.element.remove(); state.entities.floatingTexts.splice(i, 1); } 
        else {
            const screenPos = ft.pos.clone(); screenPos.project(camera);
            if (screenPos.z > 1) ft.element.style.display = 'none';
            else {
                ft.element.style.display = 'block'; ft.element.style.left = `${(screenPos.x * 0.5 + 0.5) * window.innerWidth}px`;
                ft.element.style.top = `${(screenPos.y * -0.5 + 0.5) * window.innerHeight}px`; ft.element.style.opacity = ft.life;
            }
        }
    }
    
    // Multiplayer emit
    const nowMs = Date.now();
    if (socket && nowMs - lastEmit > 50) {
        lastEmit = nowMs;
        socket.emit('update', {
            x: yawObj.position.x,
            y: yawObj.position.y,
            z: yawObj.position.z,
            yaw: yawObj.rotation.y,
            pitch: pitchObj.rotation.x,
            weaponId: getActiveWeaponId(),
            mode: state.gameMode
        });
    }
}

export function gameLoop() {
    requestAnimationFrame(gameLoop); update(); renderer.render(scene, camera);
}
