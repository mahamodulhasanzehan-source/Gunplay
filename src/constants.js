export const base64Gun = "[Placeholder for audio]";
export const base64Sniper = "[Placeholder for audio]";

export const WEAPONS = {
    pistol: { id: 'pistol', cat: 'sidearms', name: "M1911 Pistol", type: 'semi', rpm: 240, damage: 12, pierce: 1, speed: 100, color: "#aaddff" },
    gs50: { id: 'gs50', cat: 'sidearms', name: ".50 GS (Deagle)", type: 'semi', rpm: 180, damage: 25, pierce: 3, hitscan: true, color: "#e0e0e0" },
    smg: { id: 'smg', cat: 'smg', name: "MP5 Submachine", type: 'auto', rpm: 780, damage: 8, pierce: 1, speed: 100, color: "#aaffaa" },
    cbr4: { id: 'cbr4', cat: 'smg', name: "CBR4 (P90)", type: 'auto', rpm: 900, damage: 7, pierce: 3, speed: 120, color: "#8899aa" },
    vector_smg: { id: 'vector_smg', cat: 'smg', name: "Vector .45", type: 'auto', rpm: 2400, damage: 11, pierce: 1, speed: 100, color: "#eeeeee" }, 
    mac10: { id: 'mac10', cat: 'smg', name: "MAC-10", type: 'auto', rpm: 1404, damage: 6, pierce: 1, speed: 100, color: "#cccccc" }, 
    ar: { id: 'ar', cat: 'ar', name: "M4A1 Carbine", type: 'auto', rpm: 780, damage: 14, pierce: 2, speed: 150, color: "#ffccaa" },
    ak47: { id: 'ak47', cat: 'ar', name: "AK-47", type: 'auto', rpm: 600, damage: 18, pierce: 3, speed: 160, color: "#d87f3d" },
    drh: { id: 'drh', cat: 'ar', name: "DR-H", type: 'auto', rpm: 600, damage: 22, pierce: 4, speed: 200, color: "#c2b280" },
    bp50: { id: 'bp50', cat: 'ar', name: "BP50 Bullpup", type: 'auto', rpm: 840, damage: 14, pierce: 2, speed: 150, color: "#bbbbaa" },
    
    sks: { id: 'sks', cat: 'marksman', name: "SKS Marksman", type: 'semi', rpm: 327, damage: 25, pierce: 3, hitscan: true, color: "#dcb484" },
    so14: { id: 'so14', cat: 'marksman', name: "SO-14", modes:[{type:'semi', rpm:415, damage:20}, {type:'auto', rpm:800, damage:20}], pierce: 3, hitscan: true, color: "#808080" },
    m8a1: { id: 'm8a1', cat: 'marksman', name: "M8A1", modes:[{type:'burst', rpm:600, damage:13, burst:4, delay:150}, {type:'auto', rpm:1000, damage:12}], pierce: 2, hitscan: true, color: "#a19d94" },
    odin: { id: 'odin', cat: 'ar', name: "Odin Heavy AR", type: 'auto', rpm: 200, damage: 80, pierce: 4, hitscan: true, color: "#998877" }, 
    
    dlq33: { id: 'dlq33', cat: 'sniper', name: "DL Q33 Sniper", type: 'semi', rpm: 48, damage: 79, pierce: 10, hitscan: true, color: "#5a6a50" },
    lw3_tundra: { id: 'lw3_tundra', cat: 'sniper', name: "LW3 Tundra Sniper", type: 'semi', rpm: 60, damage: 79, pierce: 7, hitscan: true, color: "#444444" },
    
    krm262: { id: 'krm262', cat: 'special', name: "KRM-262 Shotgun", type: 'semi', rpm: 90, damage: 30, pierce: 2, hitscan: false, speed: 50, color: "#bb3333", special: "shotgun_horizontal" },
    swarm_killer_smg: { id: 'swarm_killer_smg', cat: 'special', name: "Swarm Killer SMG", type: 'auto', rpm: 1980, damage: 4, pierce: 100, hitscan: true, color: "#ff00ff", special: "spread_horizontal" },
    swarm_killer_ar: { id: 'swarm_killer_ar', cat: 'special', name: "Swarm Killer AR", type: 'auto', rpm: 3000, damage: 30, pierce: 200, hitscan: true, color: "#00ffff" },
    mosquito: { id: 'mosquito', cat: 'special', name: "Mosquito", type: 'auto', rpm: 60000, damage: 999999, pierce: 999999, hitscan: true, color: "#eeff00" }
};

export const SURVIVAL_WEAPONS = {
    pistol: { id: 'pistol', cat: 'sidearms', name: "Basic Pistol", type: 'semi', rpm: 240, damage: 2, pierce: 1, pierceChance: 0, mag: 15, reserve: 150, reload: 2, cost: 0, ammoCost: 5, color: "#aaddff", hitscan: false, speed: 100 },
    smg: { id: 'smg', cat: 'smg', name: "Basic SMG (MP5)", type: 'auto', rpm: 780, damage: 1.25, pierce: 1, pierceChance: 30, mag: 50, reserve: 500, reload: 2.5, cost: 100, ammoCost: 10, color: "#aaffaa", hitscan: false, speed: 100 },
    ak47: { id: 'ak47', cat: 'ar', name: "Basic AR (AK-47)", type: 'auto', rpm: 600, damage: 2.45, pierce: 2, pierceChance: 0, mag: 45, reserve: 450, reload: 3, cost: 300, ammoCost: 25, color: "#d87f3d", hitscan: false, speed: 160 },
    gs50: { id: 'gs50', cat: 'sidearms', name: ".50 Cal (Grekova)", type: 'semi', rpm: 180, damage: 5.35, pierce: 2, pierceChance: 0, mag: 20, reserve: 200, reload: 1, cost: 100, ammoCost: 5, color: "#e0e0e0", hitscan: true },
    vector_smg: { id: 'vector_smg', cat: 'smg', name: "Vector", type: 'auto', rpm: 960, damage: 2, pierce: 1, pierceChance: 70, mag: 50, reserve: 500, reload: 2, cost: 600, ammoCost: 15, color: "#eeeeee", hitscan: false, speed: 100 },
    odin: { id: 'odin', cat: 'ar', name: "Odin", type: 'auto', rpm: 200, damage: 11.97, pierce: 3, pierceChance: 100, mag: 50, reserve: 500, reload: 2, cost: 800, ammoCost: 35, color: "#998877", hitscan: true, speed: 200 }
};

export const ZOMBIES = {
    green:  { hp: 31.25, speed: 4, color: 0x00ff00, height: 2, scale: 1 },
    red:    { hp: 37.5, speed: 6, color: 0xff3333, height: 2, scale: 0.9 }, 
    purple: { hp: 125, speed: 3, color: 0xbf00ff, height: 2, scale: 1.2 }, 
    tall:   { hp: 187.5, speed: 3.5, color: 0x660066, height: 3.5, scale: 1.1 } 
};

export const SURVIVAL_ZOMBIES = {
    "NormalZombie": { color: 0x32c832, height: 2, scale: 1, hp: 10, speed: 2, dmg: 1, dmgChance: 0, bonusDmg: 0, cooldown: 1, money: 10 },
    "ThreeBlockGreenZombie": { color: 0x32c832, height: 3, scale: 1, hp: 20, speed: 2, dmg: 1, dmgChance: 0, bonusDmg: 0, cooldown: 1, money: 20 },
    "TwoBlockRedZombie": { color: 0xdc1414, height: 2, scale: 1, hp: 30, speed: 10, dmg: 1, dmgChance: 50, bonusDmg: 1, cooldown: 1, money: 50 },
    "ThreeBlockRedZombie": { color: 0xdc1414, height: 3, scale: 1, hp: 50, speed: 10, dmg: 1, dmgChance: 50, bonusDmg: 1, cooldown: 1, money: 70 },
    "TwoBlockBlueZombie": { color: 0x0000b4, height: 2, scale: 1, hp: 40, speed: 15, dmg: 2, dmgChance: 30, bonusDmg: 1, cooldown: 0.7, money: 90 },
    "ThreeBlockBlueZombie": { color: 0x0000b4, height: 3, scale: 1, hp: 70, speed: 15, dmg: 2, dmgChance: 30, bonusDmg: 1, cooldown: 0.7, money: 100 },
    "TwoBlockPurpleZombie": { color: 0x800080, height: 2, scale: 1, hp: 60, speed: 20, dmg: 3, dmgChance: 20, bonusDmg: 3, cooldown: 0.5, money: 140 },
    "ThreeBlockPurpleZombie": { color: 0x800080, height: 3, scale: 1, hp: 100, speed: 20, dmg: 3, dmgChance: 20, bonusDmg: 3, cooldown: 0.5, money: 160 },
    "TwoBlockBlackZombie": { color: 0x111111, height: 2, scale: 1, hp: 200, speed: 14.28, dmg: 4, dmgChance: 30, bonusDmg: 3, cooldown: 0.1, money: 200, blitz: true },
    "ThreeBlockBlackZombie": { color: 0x111111, height: 3, scale: 1, hp: 250, speed: 14.28, dmg: 4, dmgChance: 30, bonusDmg: 3, cooldown: 0.1, money: 250, blitz: true }
};

export const WAVE_CONFIGS = {
    1: { initialSpawn: {"NormalZombie": 5}, totalZombies: 5, phases:[] },
    2: { initialSpawn: {"NormalZombie": 5, "ThreeBlockGreenZombie": 2}, totalZombies: 7, phases:[] },
    3: { initialSpawn: {"NormalZombie": 5, "ThreeBlockGreenZombie": 1}, totalZombies: 7, phases:[ {triggerKills: 5, spawn: {"TwoBlockRedZombie": 1}} ] },
    4: { initialSpawn: {"NormalZombie": 5, "ThreeBlockGreenZombie": 1}, totalZombies: 8, phases:[ {triggerKills: 5, spawn: {"TwoBlockRedZombie": 1, "ThreeBlockRedZombie": 1}} ] },
    5: { initialSpawn: {"NormalZombie": 5, "ThreeBlockGreenZombie": 1}, totalZombies: 9, phases:[ {triggerKills: 5, spawn: {"TwoBlockRedZombie": 1}}, {triggerKills: 1, spawn: {"TwoBlockBlueZombie": 1, "ThreeBlockRedZombie": 1}} ] },
    6: { initialSpawn: {"NormalZombie": 10}, totalZombies: 16, phases:[ {triggerKills: 5, spawn: {"ThreeBlockGreenZombie": 3}}, {triggerKills: 3, spawn: {"ThreeBlockBlueZombie": 1, "ThreeBlockRedZombie": 2}} ] },
    7: { initialSpawn: {"NormalZombie": 10}, totalZombies: 17, phases:[ {triggerKills: 5, spawn: {"ThreeBlockGreenZombie": 3}}, {triggerKills: 3, spawn: {"ThreeBlockRedZombie": 2, "ThreeBlockBlueZombie": 1}}, {triggerKills: 2, spawn: {"TwoBlockPurpleZombie": 1}} ] },
    8: { initialSpawn: {"NormalZombie": 10}, totalZombies: 16, phases:[ {triggerKills: 5, spawn: {"ThreeBlockGreenZombie": 3}}, {triggerKills: 3, spawn: {"ThreeBlockBlueZombie": 2, "ThreeBlockPurpleZombie": 1}} ] },
    9: { initialSpawn: {"NormalZombie": 10}, totalZombies: 46, phases:[ {triggerKills: 5, spawn: {"ThreeBlockGreenZombie": 3}}, {triggerKills: 3, spawn: {"ThreeBlockBlueZombie": 1, "ThreeBlockRedZombie": 2}}, {triggerKills: 3, spawn: {"NormalZombie": 20, "ThreeBlockGreenZombie": 10}} ] },
    10: { initialSpawn: {"TwoBlockRedZombie": 5, "ThreeBlockBlueZombie": 1}, totalZombies: 7, phases:[ {triggerKills: 6, spawn: {"TwoBlockBlackZombie": 1}} ] },
    11: { initialSpawn: {"TwoBlockPurpleZombie": 2, "ThreeBlockPurpleZombie": 1}, totalZombies: 4, phases:[ {triggerKills: 3, spawn: {"ThreeBlockBlackZombie": 1}} ] }
};

import * as THREE from 'three';

export const state = {
    gameMode: null, 
    keys: {}, mouse: false, mouseJustPressed: false, menuOpen: null, paused: false,
    settings: { gunVolume: 0.1 }, 
    player: { 
        primary: 'ar', secondary: 'pistol', activeSlot: 2, weaponMode: 0, 
        burstsRemaining: 0, burstNextShotTime: 0, burstCooldownEnd: 0,
        velocity: new THREE.Vector3(), direction: new THREE.Vector3(), ads: false, lastShot: 0,
        sliding: false, slideTime: 0, slideDir: new THREE.Vector3(), slideLock: false
    },
    recoil: { camPitch: 0, camYaw: 0, targetCamPitch: 0, targetCamYaw: 0, wepZ: 0, wepPitch: 0, targetWepZ: 0, targetWepPitch: 0 },
    gameplay: { spawns: false, prob: 0.1, kills: 0, lastZType: null },
    survival: {
        health: 50, maxHealth: 50, money: 0, wave: 1,
        zombiesKilledThisWave: 0, zombiesKilledThisPhase: 0, currentPhase: 0, activeZombies: 0,
        waveState: 'COUNTDOWN', countdownTimer: 5, lastTime: 0,
        inventory: { 'Pistol': { id: 'pistol', mag: 15, reserve: 45 }, 'SMG': null, 'AR': null },
        activeType: 'Pistol', reloading: false, reloadTimer: 0, damageFlashTimer: 0, lastBPressTime: 0
    },
    entities: { zombies: [], bullets:[], particles:[], trails:[], floatingTexts:[] }
};
