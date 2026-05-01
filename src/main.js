import { camera, renderer, initScene } from './scene.js';
import { setupEventListeners } from './movement.js';
import { state, WEAPONS } from './constants.js';
import { getActiveWeaponId, toggleMenu } from './ui.js';
import { buildWeaponMesh } from './weapons.js';
import { gameLoop } from './game.js';
import { initMultiplayer, socket } from './multiplayer.js';
import './index.css';

window.onload = () => {
    initScene();
    initMultiplayer();
    setupEventListeners();

    // Tester Armory Population
    const cols = { 
        sidearms: document.getElementById('col-sidearms'), smg: document.getElementById('col-smg'), 
        ar: document.getElementById('col-ar'), marksman: document.getElementById('col-marksman'), 
        sniper: document.getElementById('col-sniper'), special: document.getElementById('col-special') 
    };
    const weaponsArr = Object.values(WEAPONS).map(w => {
        let rpm, dmg;
        if (w.modes) { const autoMode = w.modes.find(m => m.type === 'auto') || w.modes[0]; rpm = autoMode.rpm; dmg = autoMode.damage; } 
        else { rpm = w.rpm; dmg = w.damage; }
        return { ...w, displayRpm: rpm, displayDmg: dmg, dps: (rpm / 60) * dmg };
    }).sort((a, b) => a.dps - b.dps);

    weaponsArr.forEach(w => {
        if(cols[w.cat]) {
            const btn = document.createElement('div'); btn.className = 'weapon-btn'; btn.dataset.id = w.id; 
            const dpsText = w.dps > 10000 ? 'INF' : w.dps.toFixed(0);
            btn.innerHTML = `<span class="weapon-btn-name">${w.name}</span><span class="weapon-btn-stats">DMG: ${w.displayDmg} | RPM: ${w.displayRpm} | DPS: ${dpsText}</span>`;
            btn.onclick = () => {
                if (w.cat === 'sidearms') { state.player.secondary = w.id; state.player.activeSlot = 2; } 
                else { state.player.primary = w.id; state.player.activeSlot = 1; }
                state.player.weaponMode = 0; state.player.burstsRemaining = 0;
                const activeId = getActiveWeaponId(); const activeW = WEAPONS[activeId];
                let modeText = activeW.modes ? ` (${activeW.modes[0].type.toUpperCase()})` : '';
                document.getElementById('hudWeaponName').innerText = activeW.name + modeText;
                buildWeaponMesh(activeId); toggleMenu(null);
            };
            cols[w.cat].appendChild(btn);
        }
    });

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    buildWeaponMesh('pistol');
    gameLoop();
};
