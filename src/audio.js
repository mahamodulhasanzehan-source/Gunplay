import { WEAPONS, SURVIVAL_WEAPONS, state } from './constants.js';
import { base64Gun, base64Sniper } from './audioData.js';

export let audioCtx;
export let buffGun = null;
export let buffSniper = null;
export const SOUND_THROTTLE = { shoot: 0, hit: 0, die: 0 };

export async function decodeSounds() {
    if (!audioCtx) return;
    try {
        const src1 = base64Gun.startsWith('data:') ? base64Gun : 'data:audio/mp3;base64,' + base64Gun;
        const r1 = await fetch(src1);
        const ab1 = await r1.arrayBuffer();
        buffGun = await audioCtx.decodeAudioData(ab1);
    } catch(e) {}
    
    try {
        const src2 = base64Sniper.startsWith('data:') ? base64Sniper : 'data:audio/mp3;base64,' + base64Sniper;
        const r2 = await fetch(src2);
        const ab2 = await r2.arrayBuffer();
        buffSniper = await audioCtx.decodeAudioData(ab2);
    } catch(e) {}
}

export function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const comp = audioCtx.createDynamicsCompressor();
        comp.threshold.value = -12; 
        comp.knee.value = 10;
        comp.ratio.value = 12; 
        comp.attack.value = 0.003; 
        comp.release.value = 0.25;
        comp.connect(audioCtx.destination);
        audioCtx.masterOut = comp;
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

export function playSound(type, weaponId = null) {
    if (!audioCtx) return;
    const nowMs = Date.now();
    
    if (type === 'shoot_fast' && nowMs - SOUND_THROTTLE.shoot < 20) return;
    if (type === 'shoot' && nowMs - SOUND_THROTTLE.shoot < 50) return;
    if (type === 'hit' && nowMs - SOUND_THROTTLE.hit < 40) return;
    if (type === 'die' && nowMs - SOUND_THROTTLE.die < 40) return;

    if (type.startsWith('shoot')) SOUND_THROTTLE.shoot = nowMs;
    if (type === 'hit') SOUND_THROTTLE.hit = nowMs;
    if (type === 'die') SOUND_THROTTLE.die = nowMs;

    const now = audioCtx.currentTime;

    if ((type === 'shoot' || type === 'shoot_fast') && weaponId) {
        const w = WEAPONS[weaponId] || SURVIVAL_WEAPONS[Object.keys(SURVIVAL_WEAPONS).find(k=>SURVIVAL_WEAPONS[k].id===weaponId)];
        if (w && w.cat !== 'special') {
            let bufferToUse = null;
            let rate = 1.0;
            let vol = 1.0;

            if (w.cat === 'sidearms') {
                bufferToUse = buffGun;
                if (w.id === 'gs50') { rate = 1.25; vol = 1.2; } else { rate = 1.4; vol = 0.6; }
            } else if (w.cat === 'smg') {
                bufferToUse = buffGun; rate = 1.35; vol = 0.8;
            } else if (w.cat === 'ar' || w.cat === 'marksman' || w.cat === 'sniper') {
                if (w.cat === 'sniper') { bufferToUse = buffSniper; rate = 1.0; } 
                else if (w.id === 'sks' || w.id === 'so14' || w.id === 'm8a1') { bufferToUse = buffSniper; rate = 0.85; vol = 0.6; } 
                else if (w.id === 'odin') { bufferToUse = buffGun; rate = 0.45; vol = 1.8; } 
                else { bufferToUse = buffGun; rate = 1.15; }
            }

            if (bufferToUse) {
                const src = audioCtx.createBufferSource();
                src.buffer = bufferToUse;
                src.playbackRate.value = rate;
                const customGain = audioCtx.createGain();
                customGain.gain.value = vol * state.settings.gunVolume;
                if (w.id === 'gs50') {
                    customGain.gain.setValueAtTime(vol * state.settings.gunVolume, now);
                    customGain.gain.setTargetAtTime(0.001, now + 1, 0.1); 
                }
                src.connect(customGain); customGain.connect(audioCtx.masterOut); src.start(0); return; 
            }
        }
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.masterOut);

    if (type === 'shoot') {
        osc.type = 'square'; osc.frequency.setValueAtTime(300, now); osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'shoot_fast') {
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(600, now); osc.frequency.exponentialRampToValueAtTime(200, now + 0.05);
        gain.gain.setValueAtTime(0.05, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now); osc.stop(now + 0.05);
    } else if (type === 'hit') {
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, now); osc.frequency.exponentialRampToValueAtTime(50, now + 0.08);
        gain.gain.setValueAtTime(0.03, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now); osc.stop(now + 0.08);
    } else if (type === 'die') {
        osc.type = 'triangle'; osc.frequency.setValueAtTime(120, now); osc.frequency.exponentialRampToValueAtTime(20, now + 0.3);
        gain.gain.setValueAtTime(0.08, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now); osc.stop(now + 0.3);
    } else if (type === 'jump') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(200, now); osc.frequency.linearRampToValueAtTime(400, now + 0.15);
        gain.gain.setValueAtTime(0.03, now); gain.gain.linearRampToValueAtTime(0.001, now + 0.15);
        osc.start(now); osc.stop(now + 0.15);
    } else if (type === 'damage') {
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(100, now); osc.frequency.exponentialRampToValueAtTime(40, now + 0.4);
        gain.gain.setValueAtTime(0.8, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now); osc.stop(now + 0.4);
    } else if (type === 'waveStart') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(200, now); osc.frequency.exponentialRampToValueAtTime(800, now + 0.3);
        gain.gain.setValueAtTime(0.3, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now); osc.stop(now + 0.3);
    } else if (type === 'waveEnd') {
        osc.type = 'triangle'; osc.frequency.setValueAtTime(400, now); osc.frequency.exponentialRampToValueAtTime(200, now + 0.5);
        gain.gain.setValueAtTime(0.4, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now); osc.stop(now + 0.5);
    } else if (type === 'empty_mag') {
        osc.type = 'square'; osc.frequency.setValueAtTime(800, now); osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
        gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
    }
}
