import { state, WEAPONS, SURVIVAL_WEAPONS } from './constants.js';
import { buildWeaponMesh } from './weapons.js';
import { scene } from './scene.js';

export function updateBrightness() {
    const val = parseInt(document.getElementById('brightSlider').value);
    const overlay = document.getElementById('brightnessOverlay');
    if (val <= 30) {
        overlay.style.backgroundColor = 'black';
        overlay.style.opacity = (30 - val) / 30; 
    } else {
        overlay.style.backgroundColor = 'white';
        overlay.style.opacity = ((val - 30) / 70) * 0.4; 
    }
}

export function getActiveWeaponId() {
    if (state.gameMode === 'survival') {
        const inv = state.survival.inventory[state.survival.activeType];
        return inv ? inv.id : 'pistol';
    } else {
        return state.player.activeSlot === 1 ? state.player.primary : state.player.secondary;
    }
}

export function getActiveWeaponStats() {
    if (state.gameMode === 'survival') {
        const inv = state.survival.inventory[state.survival.activeType];
        if (!inv) return SURVIVAL_WEAPONS['pistol'];
        return SURVIVAL_WEAPONS[Object.keys(SURVIVAL_WEAPONS).find(k => SURVIVAL_WEAPONS[k].id === inv.id)];
    } else {
        return WEAPONS[getActiveWeaponId()];
    }
}

export function switchSurvivalGun(type) {
    state.survival.activeType = type;
    state.player.ads = false;
    document.getElementById('scopeOverlay').style.display = 'none';
    document.getElementById('crosshair').style.display = 'block';
    state.survival.reloading = false;
    
    const inv = state.survival.inventory[type];
    buildWeaponMesh(inv.id);
    updateSurvivalHUD();
}

export function startReload() {
    const inv = state.survival.inventory[state.survival.activeType];
    const wStats = getActiveWeaponStats();
    if (inv.mag < wStats.mag && inv.reserve > 0 && !state.survival.reloading) {
        state.survival.reloading = true;
        state.survival.reloadTimer = Date.now() + wStats.reload * 1000;
        updateSurvivalHUD();
    }
}

export function toggleMenu(menuType) {
    const shop = document.getElementById('shopModal');
    const prob = document.getElementById('probModal');
    const vol = document.getElementById('volModal');
    const survShop = document.getElementById('survivalShopModal');
    const bright = document.getElementById('brightModal');

    shop.style.display = 'none'; prob.style.display = 'none'; vol.style.display = 'none'; survShop.style.display = 'none'; bright.style.display = 'none';
    state.menuOpen = menuType;

    if (menuType === 'shop' || menuType === 'prob' || menuType === 'vol' || menuType === 'survivalShop' || menuType === 'bright') {
        document.exitPointerLock();
        state.mouse = false; state.player.ads = false; state.paused = true;
        if (menuType === 'shop') { shop.style.display = 'flex'; updateArmoryHighlights(); }
        if (menuType === 'survivalShop') { survShop.style.display = 'flex'; updateSurvivalShop(); }
        if (menuType === 'prob') prob.style.display = 'flex';
        if (menuType === 'vol') vol.style.display = 'flex';
        if (menuType === 'bright') bright.style.display = 'flex';
    } else {
        document.body.requestPointerLock();
    }
}

export function updateArmoryHighlights() {
    if (state.gameMode === 'survival') return;
    document.querySelectorAll('.weapon-btn').forEach(b => {
        b.classList.remove('active', 'active-equipped');
        if (b.dataset.id === state.player.primary || b.dataset.id === state.player.secondary) b.classList.add('active'); 
        if (b.dataset.id === getActiveWeaponId()) b.classList.add('active-equipped'); 
    });
}

// Global exposure for onClick handlers in HTML
window.buySurvivalGun = function(id) {
    const gunDef = SURVIVAL_WEAPONS[Object.keys(SURVIVAL_WEAPONS).find(k => SURVIVAL_WEAPONS[k].id === id)];
    let slot = 'Pistol'; if (gunDef.cat === 'smg') slot = 'SMG'; if (gunDef.cat === 'ar') slot = 'AR';
    const inv = state.survival.inventory;
    
    if (!inv[slot] || inv[slot].id !== id) {
        if (state.survival.money >= gunDef.cost) {
            state.survival.money -= gunDef.cost;
            inv[slot] = { id: id, mag: gunDef.mag, reserve: gunDef.mag * 2 };
            if (state.survival.activeType !== slot) switchSurvivalGun(slot);
            else { buildWeaponMesh(id); updateSurvivalHUD(); }
        }
    } else {
        if (state.survival.money >= gunDef.ammoCost * 2) {
            state.survival.money -= gunDef.ammoCost * 2;
            inv[slot].reserve = Math.min(inv[slot].reserve + gunDef.mag * 2, gunDef.reserve);
        }
    }
    updateSurvivalShop(); updateSurvivalHUD();
};

window.buyBandAid = function() {
    if (state.survival.money >= 50 && state.survival.health < state.survival.maxHealth) {
        state.survival.money -= 50; state.survival.health = state.survival.maxHealth;
        updateSurvivalShop(); updateSurvivalHUD();
    }
};

window.restartSurvival = function() {
    document.getElementById('survivalGameOver').style.display = 'none'; document.getElementById('survivalVictory').style.display = 'none';
    state.survival = {
        health: 50, maxHealth: 50, money: 0, wave: 1,
        zombiesKilledThisWave: 0, zombiesKilledThisPhase: 0, currentPhase: 0, activeZombies: 0,
        waveState: 'COUNTDOWN', countdownTimer: 5, lastTime: 0,
        inventory: { 'Pistol': { id: 'pistol', mag: 15, reserve: 45 }, 'SMG': null, 'AR': null },
        activeType: 'Pistol', reloading: false, reloadTimer: 0, damageFlashTimer: 0, lastBPressTime: 0
    };
    state.entities.zombies.forEach(z => scene.remove(z.mesh)); state.entities.zombies =[];
    state.entities.floatingTexts.forEach(ft => ft.element.remove()); state.entities.floatingTexts =[];
    
    updateSurvivalHUD(); switchSurvivalGun('Pistol'); document.body.requestPointerLock();
};


export function updateSurvivalShop() {
    const inv = state.survival.inventory;
    document.getElementById('survMoneyText').innerText = `$${state.survival.money}`;
    
    const pistolUpgraded = inv['Pistol'] && inv['Pistol'].id === 'gs50';
    const smgUpgraded = inv['SMG'] && inv['SMG'].id === 'vector_smg';
    const arUpgraded = inv['AR'] && inv['AR'].id === 'odin';

    document.getElementById('btnBuyPistol').style.display = pistolUpgraded ? 'none' : 'block';
    document.getElementById('btnBuySMG').style.display = smgUpgraded ? 'none' : 'block';
    document.getElementById('btnBuyAR').style.display = arUpgraded ? 'none' : 'block';

    if (pistolUpgraded && smgUpgraded && arUpgraded) {
        document.getElementById('col-basic-guns').style.display = 'none';
    } else {
        document.getElementById('col-basic-guns').style.display = 'flex';
    }

    if (!pistolUpgraded) document.getElementById('costPistol').innerText = `Ammo $10`;
    document.getElementById('costGs50').innerText = pistolUpgraded ? `Ammo $10` : `Buy $100`;
    
    if (!smgUpgraded) {
        if (inv['SMG'] && inv['SMG'].id === 'smg') document.getElementById('costSMG').innerText = `Ammo $20`;
        else document.getElementById('costSMG').innerText = `Buy $100`;
    }
    document.getElementById('costVector').innerText = smgUpgraded ? `Ammo $30` : `Buy $600`;
    
    if (!arUpgraded) {
        if (inv['AR'] && inv['AR'].id === 'ak47') document.getElementById('costAR').innerText = `Ammo $50`;
        else document.getElementById('costAR').innerText = `Buy $300`;
    }
    document.getElementById('costOdin').innerText = arUpgraded ? `Ammo $70` : `Buy $800`;
}

export function updateSurvivalHUD() {
    const surv = state.survival;
    document.getElementById('survHealthText').innerText = `${surv.health} / ${surv.maxHealth} HP`;
    document.getElementById('survHealthBar').style.width = `${(surv.health / surv.maxHealth) * 100}%`;
    document.getElementById('survMoneyText').innerText = `$${surv.money}`;
    
    if (surv.reloading) {
        document.getElementById('survAmmoText').innerText = `Reloading...`;
    } else {
        const inv = surv.inventory[surv.activeType];
        if (inv) {
            document.getElementById('survAmmoText').innerText = `${inv.mag} / ${inv.reserve}`;
            const gunDef = SURVIVAL_WEAPONS[Object.keys(SURVIVAL_WEAPONS).find(k => SURVIVAL_WEAPONS[k].id === inv.id)];
            document.getElementById('survGunNameText').innerText = gunDef.name;
        }
    }
}
