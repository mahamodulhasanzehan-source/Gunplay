import * as THREE from 'three';

export let canvas;
export let renderer;
export let scene;
export let camera;
export let cameraRecoilObj;
export let pitchObj;
export let yawObj;
export let viewmodel;
export let raycaster;
export let stationMesh;
export let stationPos;
export let floor;

// Initialize function to execute after DOM loads
export function initScene() {
    canvas = document.getElementById('gameCanvas');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x09090b);
    scene.fog = new THREE.FogExp2(0x09090b, 0.02);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    cameraRecoilObj = new THREE.Object3D();
    cameraRecoilObj.add(camera);

    pitchObj = new THREE.Object3D();
    yawObj = new THREE.Object3D();
    yawObj.position.y = 2; 
    yawObj.add(pitchObj);
    pitchObj.add(cameraRecoilObj);
    scene.add(yawObj);

    viewmodel = new THREE.Group();
    viewmodel.position.set(0.3, -0.25, -0.5); 
    pitchObj.add(viewmodel);

    scene.add(new THREE.AmbientLight(0xffffff, 1.5));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    const gridHelper = new THREE.GridHelper(200, 100, 0x00ff9d, 0x222222);
    gridHelper.position.y = 0;
    scene.add(gridHelper);
    
    const floorGeo = new THREE.PlaneGeometry(200, 200);
    const floorMat = new THREE.MeshBasicMaterial({ color: 0x050505, depthWrite: false });
    floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    stationPos = new THREE.Vector3(10, 1.5, -10);
    const stationGeo = new THREE.BoxGeometry(3, 3, 3);
    const stationMat = new THREE.MeshBasicMaterial({ color: 0x00aaff, wireframe: true });
    stationMesh = new THREE.Mesh(stationGeo, stationMat);
    stationMesh.position.copy(stationPos);
    scene.add(stationMesh);
    
    const stationCoreGeo = new THREE.BoxGeometry(2.8, 2.8, 2.8);
    const stationCoreMat = new THREE.MeshBasicMaterial({ color: 0x0044aa, transparent: true, opacity: 0.5 });
    const stationCore = new THREE.Mesh(stationCoreGeo, stationCoreMat);
    stationMesh.add(stationCore);

    raycaster = new THREE.Raycaster();
}
