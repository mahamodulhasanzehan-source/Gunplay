import { state, WEAPONS, WAVE_CONFIGS } from './constants.js';
import { yawObj, pitchObj, scene, stationPos } from './scene.js';
import { updateBrightness, switchSurvivalGun, startReload, toggleMenu, updateSurvivalHUD, updateSurvivalShop, getActiveWeaponId, getActiveWeaponStats, updateArmoryHighlights } from './ui.js';
import { buildWeaponMesh } from './weapons.js';
import { spawnZombies } from './zombies.js';
import { initAudio, decodeSounds } from './audio.js';

export function setupEventListeners() {
    document.getElementById('btnTester').addEventListener('click', () => {
        state.gameMode = 'tester';
        document.getElementById('modeSelectScreen').style.display = 'none';
        document.getElementById('startScreen').style.display = 'flex';
        updateBrightness();
    });

    document.getElementById('btnSurvival').addEventListener('click', () => {
        state.gameMode = 'survival';
        document.getElementById('modeSelectScreen').style.display = 'none';
        
        document.getElementById('startScreen').style.display = 'flex';
        document.getElementById('startScreen').querySelector('h1').innerText = "SURVIVAL MODE";
        document.getElementById('startScreen').querySelector('p').innerText = "Infinite Zig-Zag World 3D";
        
        document.querySelector('.hud-container').style.display = 'none';
        document.getElementById('survivalHud').style.display = 'block';
        
        document.querySelector('.controls-help').innerHTML = "[W,A,S,D]: Move | [SPACE]: Jump | [SHIFT]: Run<br>[C]: Slide |[SCROLL WHEEL] or[1,2,3]: Swap Weapons<br>[LEFT CLICK]: Shoot | [RIGHT CLICK]: ADS (Aim)<br>[R]: Reload | [F]: Buy Station | [B]: Quick Band-Aid<br>[P]: Brightness Settings | [M] / [N]: Cheat Codes<br>[ESC] or[CTRL]: Pause Game";
        
        updateBrightness();
        buildWeaponMesh(getActiveWeaponId());
    });

    document.getElementById('startBtn').addEventListener('click', () => {
        document.getElementById('startScreen').style.display = 'none';
        initAudio();
        decodeSounds();
        document.body.requestPointerLock();
        if (state.gameMode === 'survival') updateSurvivalHUD();
    });

    document.addEventListener('pointerlockchange', () => {
        const isEndgame = state.gameMode === 'survival' && (state.survival.waveState === 'GAMEOVER' || state.survival.waveState === 'VICTORY');
        
        if (document.pointerLockElement !== document.body && state.menuOpen === null && !isEndgame && state.gameMode !== null) {
            document.getElementById('startScreen').style.display = 'flex';
            document.getElementById('startScreen').querySelector('h1').innerText = "PAUSED";
            document.getElementById('startBtn').innerText = "Resume";
            state.paused = true; 
        } else if (document.pointerLockElement === document.body && !isEndgame) {
            state.paused = false;
            document.getElementById('startScreen').style.display = 'none';
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement === document.body && !state.paused) {
            let baseSens = 0.002;
            const activeId = getActiveWeaponId();
            if (state.gameMode === 'tester') {
                const wStats = WEAPONS[activeId];
                const isSniperOrMarksman =['dlq33', 'lw3_tundra', 'sks'].includes(wStats.id);
                if (state.player.ads && isSniperOrMarksman) baseSens = 0.001; 
            } else {
                if (state.player.ads) baseSens = 0.0012;
            }

            yawObj.rotation.y -= e.movementX * baseSens;
            pitchObj.rotation.x -= e.movementY * baseSens;
            pitchObj.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, pitchObj.rotation.x));
        }
    });

    window.addEventListener('contextmenu', e => e.preventDefault());

    document.addEventListener('wheel', (e) => {
        if (state.menuOpen || state.paused || document.pointerLockElement !== document.body) return;
        if (e.deltaY !== 0) {
            if (state.gameMode === 'survival') {
                const types =['Pistol', 'SMG', 'AR'];
                let idx = types.indexOf(state.survival.activeType);
                let attempts = 0;
                while(!state.survival.inventory[types[idx]] || attempts === 0) {
                    if (e.deltaY > 0) idx = (idx + 1) % 3;
                    else idx = (idx - 1 + 3) % 3;
                    attempts++;
                    if (state.survival.inventory[types[idx]]) break;
                    if (attempts > 3) break;
                }
                if (state.survival.inventory[types[idx]]) switchSurvivalGun(types[idx]);
            } else {
                state.player.activeSlot = state.player.activeSlot === 1 ? 2 : 1;
                state.player.ads = false;
                state.player.weaponMode = 0;
                state.player.burstsRemaining = 0;
                document.getElementById('scopeOverlay').style.display = 'none';
                document.getElementById('crosshair').style.display = 'block';
                const activeId = getActiveWeaponId();
                const w = WEAPONS[activeId];
                let modeText = w.modes ? ` (${w.modes[0].type.toUpperCase()})` : '';
                document.getElementById('hudWeaponName').innerText = w.name + modeText;
                buildWeaponMesh(activeId);
                updateArmoryHighlights();
            }
        }
    });

    document.addEventListener('keydown', e => {
        if (!state.gameMode) return;
        const k = e.key.toLowerCase();
        state.keys[k] = true;

        if (k === 'control' || e.key === 'Escape') {
            if (document.pointerLockElement === document.body) document.exitPointerLock(); 
        }

        if (state.gameMode === 'tester') {
            if (k === 'b') {
                const activeId = getActiveWeaponId();
                const w = WEAPONS[activeId];
                if (w.modes && w.modes.length > 1) {
                    state.player.weaponMode = (state.player.weaponMode + 1) % w.modes.length;
                    state.player.burstsRemaining = 0;
                    document.getElementById('hudWeaponName').innerText = w.name + " (" + w.modes[state.player.weaponMode].type.toUpperCase() + ")";
                }
            }
            if (k === 't') {
                state.gameplay.spawns = !state.gameplay.spawns;
                if(state.gameplay.spawns) spawnZombies(3);
                else {
                    state.entities.zombies.forEach(z => scene.remove(z.mesh));
                    state.entities.zombies =[];
                }
            }
            if (k === 'p' && state.menuOpen !== 'shop' && state.menuOpen !== 'vol') {
                if (state.menuOpen === 'prob') toggleMenu(null); else toggleMenu('prob');
            }
        } else if (state.gameMode === 'survival') {
            if (k === '1' && state.survival.inventory['Pistol']) switchSurvivalGun('Pistol');
            if (k === '2' && state.survival.inventory['SMG']) switchSurvivalGun('SMG');
            if (k === '3' && state.survival.inventory['AR']) switchSurvivalGun('AR');
            if (k === 'r') startReload();
            if (k === 'b') {
                const nowMs = Date.now();
                if (nowMs - state.survival.lastBPressTime < 300) { window.buyBandAid(); state.survival.lastBPressTime = 0; } 
                else state.survival.lastBPressTime = nowMs;
            }
            if (k === 'p' && state.menuOpen !== 'shop' && state.menuOpen !== 'vol' && state.menuOpen !== 'survivalShop') {
                if (state.menuOpen === 'bright') toggleMenu(null); else toggleMenu('bright');
            }
            if (k === 'm') {
                if (document.pointerLockElement) document.exitPointerLock();
                setTimeout(() => {
                    let amt = prompt("CHEAT: Enter Money Amount:");
                    if (amt !== null && !isNaN(parseInt(amt))) {
                        state.survival.money += parseInt(amt);
                        updateSurvivalHUD(); updateSurvivalShop();
                    }
                    document.body.requestPointerLock();
                }, 100);
            }
            if (k === 'n') {
                if (document.pointerLockElement) document.exitPointerLock();
                setTimeout(() => {
                    let wave = prompt("CHEAT: Enter Wave (1-11):");
                    if (wave !== null && !isNaN(parseInt(wave))) {
                        let w = parseInt(wave);
                        if (w >= 1 && w <= Object.keys(WAVE_CONFIGS).length) {
                            state.survival.wave = w; state.survival.zombiesKilledThisWave = 0; state.survival.zombiesKilledThisPhase = 0;
                            state.survival.currentPhase = 0; state.survival.waveState = 'COUNTDOWN'; state.survival.countdownTimer = 5;
                            state.entities.zombies.forEach(z => scene.remove(z.mesh)); state.entities.zombies =[]; state.survival.activeZombies = 0;
                            updateSurvivalHUD();
                        }
                    }
                    document.body.requestPointerLock();
                }, 100);
            }
        }

        if (k === 'f') {
            const dist = yawObj.position.distanceTo(stationPos);
            if (dist < 5 && state.menuOpen !== 'prob' && state.menuOpen !== 'vol' && state.menuOpen !== 'bright') {
                if (state.gameMode === 'survival') {
                    if (state.menuOpen === 'survivalShop') toggleMenu(null); else toggleMenu('survivalShop');
                } else {
                    if (state.menuOpen === 'shop') toggleMenu(null); else toggleMenu('shop');
                }
            }
        }
        if (k === 'v' && state.menuOpen !== 'shop' && state.menuOpen !== 'prob' && state.menuOpen !== 'survivalShop' && state.menuOpen !== 'bright') {
            if (state.menuOpen === 'vol') toggleMenu(null); else toggleMenu('vol');
        }
    });

    document.addEventListener('keyup', e => state.keys[e.key.toLowerCase()] = false);
    
    document.addEventListener('mousedown', (e) => {
        if(document.pointerLockElement === document.body && !state.paused) {
            if (e.button === 0) { state.mouse = true; state.mouseJustPressed = true; }
            if (e.button === 2) state.player.ads = true;
        }
    });
    document.addEventListener('mouseup', (e) => {
        if (e.button === 0) state.mouse = false;
        if (e.button === 2) state.player.ads = false;
    });

    document.getElementById('probSlider').addEventListener('input', (e) => {
        state.gameplay.prob = e.target.value / 100;
        document.getElementById('probValueDisplay').innerText = e.target.value + "%";
    });
    
    document.getElementById('brightSlider').addEventListener('input', (e) => {
        document.getElementById('brightValueDisplay').innerText = e.target.value + "%";
        updateBrightness();
    });

    document.getElementById('volSlider').addEventListener('input', (e) => {
        state.settings.gunVolume = (e.target.value / 100) * 0.2;
        document.getElementById('volValueDisplay').innerText = e.target.value + "%";
    });
}
