import * as THREE from 'three';
import { WEAPONS, SURVIVAL_WEAPONS } from './constants.js';
import { viewmodel } from './scene.js';

export let currentWeaponMesh = null;

export function getRoundedBoxGeometry(w, h, d) {
    const r = Math.min(0.005, w/2.1, h/2.1, d/2.1); 
    const w0 = w - 2*r;
    const h0 = h - 2*r;
    const x0 = -w0/2;
    const y0 = -h0/2;
    
    const shape = new THREE.Shape();
    shape.moveTo(x0 + r, y0); shape.lineTo(x0 + w0 - r, y0); shape.quadraticCurveTo(x0 + w0, y0, x0 + w0, y0 + r);
    shape.lineTo(x0 + w0, y0 + h0 - r); shape.quadraticCurveTo(x0 + w0, y0 + h0, x0 + w0 - r, y0 + h0);
    shape.lineTo(x0 + r, y0 + h0); shape.quadraticCurveTo(x0, y0 + h0, x0, y0 + h0 - r);
    shape.lineTo(x0, y0 + r); shape.quadraticCurveTo(x0, y0, x0 + r, y0);

    return new THREE.ExtrudeGeometry(shape, { depth: d - 2*r, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: r, bevelThickness: r }).center();
}

export function buildWeaponMesh(id) {
    if (currentWeaponMesh) viewmodel.remove(currentWeaponMesh);
    const w = WEAPONS[id] || SURVIVAL_WEAPONS[Object.keys(SURVIVAL_WEAPONS).find(k=>SURVIVAL_WEAPONS[k].id===id)];
    if (!w) return;

    const mesh = new THREE.Group();
    
    const MATS = {
        black: new THREE.MeshLambertMaterial({ color: 0x111111 }), dark: new THREE.MeshLambertMaterial({ color: 0x222222 }),
        gray: new THREE.MeshLambertMaterial({ color: 0x555555 }), silver: new THREE.MeshLambertMaterial({ color: 0xa0a0a0 }),
        wood: new THREE.MeshLambertMaterial({ color: 0x5c3a21 }), tan: new THREE.MeshLambertMaterial({ color: 0x9b8a6a }), 
        olive: new THREE.MeshLambertMaterial({ color: 0x4b5320 }), red: new THREE.MeshLambertMaterial({ color: 0x8b0000 }),
        neon: new THREE.MeshBasicMaterial({ color: new THREE.Color(w.color) })
    };

    function addBox(w, h, d, x, y, z, mat) {
        const b = new THREE.Mesh(getRoundedBoxGeometry(w, h, d), mat); b.position.set(x, y, z); mesh.add(b);
    }

    if (w.id === 'pistol') { 
        addBox(0.04, 0.05, 0.25, 0, 0.05, 0, MATS.silver); 
        addBox(0.035, 0.03, 0.25, 0, 0.01, 0, MATS.dark);  
        addBox(0.038, 0.12, 0.08, 0, -0.06, 0.08, MATS.wood); 
        addBox(0.01, 0.04, 0.06, 0, -0.02, 0.0, MATS.black); 
        addBox(0.01, 0.01, 0.02, 0, 0.08, -0.1, MATS.black); 
        addBox(0.01, 0.01, 0.02, 0, 0.08, 0.1, MATS.black);  
    } 
    else if (w.id === 'gs50') { 
        addBox(0.05, 0.07, 0.35, 0, 0.06, 0, MATS.silver); 
        addBox(0.02, 0.02, 0.01, 0, 0.06, -0.175, MATS.black); 
        addBox(0.04, 0.03, 0.2, 0, 0.01, -0.075, MATS.silver); 
        addBox(0.045, 0.14, 0.1, 0, -0.07, 0.12, MATS.black); 
        addBox(0.01, 0.05, 0.08, 0, -0.02, 0.02, MATS.silver); 
        addBox(0.01, 0.02, 0.02, 0, 0.06, 0.18, MATS.dark); 
        addBox(0.01, 0.02, 0.02, 0, 0.1, -0.15, MATS.black); 
        addBox(0.01, 0.02, 0.02, 0, 0.1, 0.15, MATS.black); 
    }
    else if (w.id === 'smg') { 
        addBox(0.05, 0.08, 0.4, 0, 0.05, 0, MATS.black); 
        addBox(0.06, 0.07, 0.2, 0, 0.03, -0.15, MATS.dark); 
        addBox(0.04, 0.08, 0.06, 0, -0.04, -0.05, MATS.black); 
        addBox(0.04, 0.08, 0.06, 0, -0.1, -0.03, MATS.black); 
        addBox(0.04, 0.12, 0.08, 0, -0.06, 0.1, MATS.black); 
        addBox(0.04, 0.1, 0.25, 0, 0.03, 0.3, MATS.black); 
        addBox(0.02, 0.06, 0.02, 0, 0.1, -0.22, MATS.black); 
        addBox(0.03, 0.04, 0.03, 0, 0.1, 0.15, MATS.black); 
        addBox(0.03, 0.03, 0.15, 0, 0.05, -0.3, MATS.gray); 
    }
    else if (w.id === 'cbr4') { 
        addBox(0.06, 0.15, 0.5, 0, 0, 0.1, MATS.black); 
        addBox(0.02, 0.02, 0.1, 0, 0.05, -0.2, MATS.black); 
        addBox(0.05, 0.03, 0.3, 0, 0.09, 0, MATS.silver); 
        addBox(0.02, 0.05, 0.15, 0, 0.12, -0.05, MATS.black); 
        addBox(0.03, 0.04, 0.06, 0, 0.15, -0.05, MATS.gray); 
    }
    else if (w.id === 'vector_smg') { 
        addBox(0.05, 0.06, 0.4, 0, 0.05, 0, MATS.black); 
        addBox(0.05, 0.15, 0.12, 0, -0.05, -0.05, MATS.dark); 
        addBox(0.03, 0.15, 0.05, 0, -0.15, -0.05, MATS.black); 
        addBox(0.04, 0.12, 0.07, 0, -0.05, 0.12, MATS.black); 
        addBox(0.03, 0.08, 0.25, 0, 0.04, 0.3, MATS.black); 
        addBox(0.02, 0.02, 0.1, 0, 0.02, -0.25, MATS.gray); 
    }
    else if (w.id === 'mac10') { 
        addBox(0.04, 0.08, 0.25, 0, 0.04, 0, MATS.black); 
        addBox(0.035, 0.04, 0.25, 0, 0.1, 0, MATS.dark); 
        addBox(0.01, 0.02, 0.02, 0, 0.13, 0, MATS.silver); 
        addBox(0.06, 0.06, 0.2, 0, 0.07, -0.22, MATS.gray); 
        addBox(0.038, 0.15, 0.06, 0, -0.06, 0.08, MATS.black); 
        addBox(0.01, 0.01, 0.2, 0, 0.02, 0.2, MATS.gray); 
    }
    else if (w.id === 'ar') { 
        addBox(0.05, 0.06, 0.4, 0, 0.05, 0, MATS.black); 
        addBox(0.045, 0.05, 0.2, 0, 0, 0.05, MATS.dark); 
        addBox(0.055, 0.055, 0.25, 0, 0.05, -0.3, MATS.black); 
        addBox(0.015, 0.015, 0.15, 0, 0.05, -0.5, MATS.gray); 
        addBox(0.04, 0.12, 0.08, 0, -0.08, -0.05, MATS.gray); 
        addBox(0.04, 0.12, 0.06, 0, -0.08, 0.12, MATS.black); 
        addBox(0.04, 0.1, 0.2, 0, 0.03, 0.3, MATS.black); 
        addBox(0.01, 0.04, 0.02, 0, 0.1, 0.05, MATS.black); 
        addBox(0.01, 0.04, 0.02, 0, 0.1, -0.05, MATS.black); 
        addBox(0.01, 0.01, 0.12, 0, 0.12, 0, MATS.black); 
        addBox(0.02, 0.05, 0.04, 0, 0.08, -0.4, MATS.black); 
    }
    else if (w.id === 'ak47') { 
        addBox(0.05, 0.07, 0.35, 0, 0.05, 0, MATS.black); 
        addBox(0.045, 0.03, 0.25, 0, 0.09, 0.05, MATS.black); 
        addBox(0.06, 0.06, 0.2, 0, 0.05, -0.25, MATS.wood); 
        addBox(0.015, 0.015, 0.25, 0, 0.04, -0.45, MATS.gray); 
        addBox(0.015, 0.015, 0.15, 0, 0.07, -0.35, MATS.gray); 
        addBox(0.04, 0.09, 0.25, 0, 0.02, 0.3, MATS.wood); 
        addBox(0.04, 0.11, 0.06, 0, -0.05, 0.12, MATS.wood); 
        addBox(0.04, 0.08, 0.07, 0, -0.03, -0.05, MATS.black); 
        addBox(0.04, 0.08, 0.07, 0, -0.09, -0.08, MATS.black); 
        addBox(0.01, 0.04, 0.02, 0, 0.07, -0.55, MATS.black); 
    }
    else if (w.id === 'drh') { 
        addBox(0.055, 0.08, 0.5, 0, 0.06, -0.1, MATS.tan); 
        addBox(0.05, 0.05, 0.2, 0, 0, 0.1, MATS.tan); 
        addBox(0.04, 0.12, 0.09, 0, -0.08, -0.02, MATS.black); 
        addBox(0.04, 0.11, 0.06, 0, -0.08, 0.12, MATS.black); 
        addBox(0.05, 0.12, 0.25, 0, 0.04, 0.3, MATS.tan); 
        addBox(0.02, 0.02, 0.15, 0, 0.05, -0.42, MATS.black); 
        addBox(0.02, 0.03, 0.02, 0, 0.11, 0.1, MATS.black); 
        addBox(0.02, 0.03, 0.02, 0, 0.11, -0.3, MATS.black); 
    }
    else if (w.id === 'bp50') { 
        addBox(0.06, 0.12, 0.5, 0, 0.05, 0.05, MATS.dark); 
        addBox(0.05, 0.08, 0.3, 0, 0.15, 0.05, MATS.dark); 
        addBox(0.065, 0.08, 0.25, 0, 0.02, -0.15, MATS.dark); 
        addBox(0.04, 0.1, 0.08, 0, -0.05, 0.2, MATS.black); 
        addBox(0.04, 0.12, 0.07, 0, -0.05, 0, MATS.black); 
        addBox(0.05, 0.04, 0.15, 0, -0.05, 0.1, MATS.dark); 
        addBox(0.02, 0.02, 0.15, 0, 0.05, -0.35, MATS.black); 
        addBox(0.03, 0.03, 0.05, 0, 0.16, -0.05, MATS.gray); 
    }
    else if (w.id === 'sks') { 
        addBox(0.04, 0.06, 0.7, 0, 0.03, -0.1, MATS.wood); 
        addBox(0.045, 0.04, 0.2, 0, 0.06, 0.1, MATS.black); 
        addBox(0.04, 0.08, 0.3, 0, 0.02, 0.35, MATS.wood); 
        addBox(0.015, 0.015, 0.3, 0, 0.04, -0.6, MATS.black); 
        addBox(0.03, 0.05, 0.08, 0, -0.02, -0.05, MATS.black); 
        addBox(0.01, 0.01, 0.2, 0, 0.02, -0.5, MATS.silver); 
        addBox(0.01, 0.02, 0.02, 0, 0.06, -0.7, MATS.black); 
    }
    else if (w.id === 'so14') {
        addBox(0.045, 0.065, 0.7, 0, 0.03, -0.1, MATS.gray); 
        addBox(0.045, 0.05, 0.25, 0, 0.06, 0.05, MATS.black); 
        addBox(0.045, 0.09, 0.25, 0, 0.02, 0.35, MATS.gray); 
        addBox(0.015, 0.015, 0.2, 0, 0.04, -0.55, MATS.black); 
        addBox(0.03, 0.06, 0.08, 0, -0.02, -0.05, MATS.black); 
    }
    else if (w.id === 'm8a1') {
        addBox(0.06, 0.1, 0.55, 0, 0.04, 0, MATS.tan);
        addBox(0.04, 0.15, 0.2, 0, -0.02, 0.2, MATS.dark);
        addBox(0.04, 0.12, 0.08, 0, -0.05, -0.1, MATS.black);
        addBox(0.05, 0.08, 0.3, 0, 0.1, -0.1, MATS.dark);
        addBox(0.02, 0.02, 0.25, 0, 0.04, -0.4, MATS.black);
        addBox(0.03, 0.04, 0.05, 0, 0.15, -0.2, MATS.gray);
    }
    else if (w.id === 'odin') { 
        addBox(0.07, 0.14, 0.5, 0, 0.05, 0.1, MATS.dark); 
        addBox(0.08, 0.08, 0.3, 0, 0.05, -0.3, MATS.black); 
        addBox(0.03, 0.01, 0.3, 0, 0.125, 0, MATS.black); 
        addBox(0.05, 0.15, 0.1, 0, -0.08, 0.25, MATS.gray); 
        addBox(0.04, 0.12, 0.07, 0, -0.08, -0.05, MATS.black); 
    }
    else if (w.id === 'dlq33') { 
        addBox(0.05, 0.06, 0.3, 0, 0.05, 0, MATS.dark); 
        addBox(0.03, 0.03, 0.2, 0, 0.05, -0.25, MATS.black); 
        addBox(0.02, 0.02, 0.4, 0, 0.05, -0.5, MATS.black); 
        addBox(0.02, 0.04, 0.1, 0, 0.1, -0.05, MATS.black); 
        addBox(0.04, 0.04, 0.25, 0, 0.12, -0.05, MATS.black); 
        addBox(0.02, 0.02, 0.3, 0, 0.05, 0.3, MATS.dark); 
        addBox(0.02, 0.02, 0.25, 0, -0.02, 0.25, MATS.dark); 
        addBox(0.03, 0.1, 0.02, 0, 0.02, 0.45, MATS.black); 
        addBox(0.04, 0.1, 0.06, 0, -0.05, 0.1, MATS.black); 
        addBox(0.04, 0.08, 0.08, 0, -0.02, -0.05, MATS.black); 
        addBox(0.02, 0.02, 0.2, 0, 0.02, -0.3, MATS.gray); 
    }
    else if (w.id === 'lw3_tundra') { 
        addBox(0.06, 0.08, 0.6, 0, 0.03, 0.05, MATS.olive); 
        addBox(0.05, 0.12, 0.15, 0, 0.03, 0.4, MATS.olive); 
        addBox(0.04, 0.03, 0.1, 0, 0.1, 0.35, MATS.black); 
        addBox(0.025, 0.025, 0.5, 0, 0.05, -0.5, MATS.black); 
        addBox(0.045, 0.045, 0.3, 0, 0.12, -0.1, MATS.black); 
        addBox(0.04, 0.05, 0.08, 0, -0.03, 0.0, MATS.black); 
        addBox(0.06, 0.02, 0.02, 0.04, 0.06, 0.1, MATS.silver); 
    }
    else if (w.id === 'krm262') { 
        addBox(0.05, 0.08, 0.3, 0, 0.05, 0, MATS.dark); 
        addBox(0.025, 0.025, 0.4, 0, 0.06, -0.35, MATS.black); 
        addBox(0.025, 0.025, 0.35, 0, 0.03, -0.3, MATS.black); 
        addBox(0.06, 0.05, 0.15, 0, 0.025, -0.25, MATS.red); 
        addBox(0.04, 0.08, 0.25, 0, 0.02, 0.25, MATS.dark); 
        addBox(0.04, 0.1, 0.06, 0, -0.05, 0.1, MATS.black); 
    }
    else if (w.id === 'swarm_killer_smg') {
        addBox(0.08, 0.15, 0.35, 0, 0.05, 0, MATS.dark); 
        addBox(0.06, 0.1, 0.3, 0, 0.05, 0, MATS.neon); 
        addBox(0.12, 0.06, 0.25, 0, 0.05, 0.05, MATS.black);
        addBox(0.02, 0.15, 0.1, 0.045, 0.05, -0.2, MATS.gray); 
        addBox(0.02, 0.15, 0.1, -0.045, 0.05, -0.2, MATS.gray); 
        addBox(0.06, 0.12, 0.08, 0, -0.08, 0.1, MATS.black); 
        addBox(0.04, 0.1, 0.08, 0, -0.06, -0.15, MATS.dark); 
        addBox(0.07, 0.07, 0.07, 0, -0.05, 0, MATS.silver); 
        addBox(0.02, 0.02, 0.15, 0, 0.05, -0.3, MATS.neon); 
        addBox(0.02, 0.02, 0.15, 0.04, 0.05, -0.3, MATS.neon);
        addBox(0.02, 0.02, 0.15, -0.04, 0.05, -0.3, MATS.neon);
    }
    else if (w.id === 'swarm_killer_ar') {
        addBox(0.1, 0.18, 0.5, 0, 0.05, 0, MATS.dark); 
        addBox(0.08, 0.12, 0.45, 0, 0.05, 0, MATS.neon); 
        addBox(0.03, 0.03, 0.2, 0.035, 0.1, -0.35, MATS.silver);
        addBox(0.03, 0.03, 0.2, -0.035, 0.1, -0.35, MATS.silver);
        addBox(0.03, 0.03, 0.2, 0.035, 0.02, -0.35, MATS.silver);
        addBox(0.03, 0.03, 0.2, -0.035, 0.02, -0.35, MATS.silver);
        addBox(0.06, 0.1, 0.25, 0, 0.03, 0.35, MATS.dark); 
        addBox(0.04, 0.12, 0.08, 0, -0.1, 0.15, MATS.black); 
        addBox(0.06, 0.08, 0.2, 0, -0.08, -0.15, MATS.gray); 
        addBox(0.04, 0.08, 0.3, 0.06, 0.0, 0.0, MATS.black); 
        addBox(0.04, 0.08, 0.3, -0.06, 0.0, 0.0, MATS.black); 
        addBox(0.02, 0.08, 0.02, 0, -0.1, 0.05, MATS.silver);
    }
    else if (w.id === 'mosquito') {
        addBox(0.03, 0.03, 0.8, 0, 0.05, -0.1, MATS.dark); 
        addBox(0.015, 0.015, 0.9, 0, 0.05, -0.15, MATS.neon); 
        addBox(0.06, 0.06, 0.02, 0, 0.05, -0.1, MATS.silver);
        addBox(0.06, 0.06, 0.02, 0, 0.05, -0.2, MATS.silver);
        addBox(0.06, 0.06, 0.02, 0, 0.05, -0.3, MATS.silver);
        addBox(0.06, 0.06, 0.02, 0, 0.05, -0.4, MATS.silver);
        addBox(0.05, 0.1, 0.15, 0, -0.05, 0.1, MATS.neon); 
        addBox(0.03, 0.1, 0.06, 0, -0.08, 0.2, MATS.black); 
    }

    mesh.scale.set(1.5, 1.5, 1.5);
    currentWeaponMesh = mesh;
    viewmodel.add(mesh);
}
