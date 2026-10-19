'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ServerNode } from '@/components/servers/rack/RackTypes';
import {
  DoorOpen,
  DoorClosed,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface SingleRack3DCanvasProps {
  rackNumber: string;
  servers: ServerNode[];
  doorOpen: boolean;
  onToggleDoor: () => void;
  selectedServerId: string | null;
  onSelectServer: (srv: ServerNode) => void;
  soundEnabled?: boolean;
  onPlaySound?: (type: 'beep' | 'door' | 'slide' | 'alert' | 'click') => void;
}

// Generate photorealistic dynamic texture for server faceplate
function createFaceplateTexture(
  server: ServerNode,
  isOnline: boolean,
  isSelected: boolean
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Brushed dark metal background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, 256);
  bgGrad.addColorStop(0, '#222530');
  bgGrad.addColorStop(0.2, '#14161f');
  bgGrad.addColorStop(0.8, '#0b0c12');
  bgGrad.addColorStop(1, '#1b1d28');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1024, 256);

  // Metallic brushed horizontal grain
  ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
  for (let y = 0; y < 256; y += 3) {
    ctx.fillRect(0, y, 1024, 1);
  }

  // Border highlight
  ctx.strokeStyle = isSelected ? '#06b6d4' : isOnline ? '#3f3f46' : '#991b1b';
  ctx.lineWidth = isSelected ? 8 : 4;
  ctx.strokeRect(4, 4, 1016, 248);

  // Left Server Handle (Brushed Aluminum)
  ctx.fillStyle = '#52525b';
  ctx.fillRect(16, 24, 20, 208);
  ctx.fillStyle = '#a1a1aa';
  ctx.fillRect(20, 28, 4, 200);

  // Right Server Handle
  ctx.fillStyle = '#52525b';
  ctx.fillRect(988, 24, 20, 208);
  ctx.fillStyle = '#a1a1aa';
  ctx.fillRect(992, 28, 4, 200);

  // LCD Diagnostic Screen
  const lcdGrad = ctx.createLinearGradient(56, 40, 56, 216);
  lcdGrad.addColorStop(0, '#030712');
  lcdGrad.addColorStop(1, '#0f172a');
  ctx.fillStyle = lcdGrad;
  ctx.fillRect(56, 40, 370, 176);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 3;
  ctx.strokeRect(56, 40, 370, 176);

  // LCD Text Content
  ctx.fillStyle = '#06b6d4';
  ctx.font = 'bold 22px monospace';
  ctx.fillText('ITV ENTERPRISE NODE', 76, 76);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px monospace';
  const nameTruncated = (server.serverName || 'SERVER').toUpperCase();
  ctx.fillText(nameTruncated.substring(0, 16), 76, 124);

  ctx.font = '24px monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(server.ipAddress || '172.19.4.x', 76, 162);

  // Status Badge on LCD
  ctx.fillStyle = isOnline ? '#10b981' : '#ef4444';
  ctx.beginPath();
  ctx.arc(80, 192, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = 'bold 20px monospace';
  ctx.fillStyle = isOnline ? '#34d399' : '#f87171';
  ctx.fillText(isOnline ? 'ONLINE • 1ms' : 'OFFLINE • TIMEOUT', 100, 198);

  // 8x Hot-Swap Drive Bays
  const driveStartX = 450;
  for (let i = 0; i < 8; i++) {
    const dx = driveStartX + i * 50;
    ctx.fillStyle = '#18181b';
    ctx.fillRect(dx, 40, 42, 176);
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 2;
    ctx.strokeRect(dx, 40, 42, 176);

    // Drive Handle / Latch
    ctx.fillStyle = '#27272a';
    ctx.fillRect(dx + 6, 170, 30, 36);

    // Drive Activity LED
    const ledColor = isOnline ? (i % 2 === 0 ? '#10b981' : '#f59e0b') : '#7f1d1d';
    ctx.fillStyle = ledColor;
    ctx.beginPath();
    ctx.arc(dx + 21, 56, 4, 0, Math.PI * 2);
    ctx.fill();

    // Drive Label
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#71717a';
    ctx.fillText(`D${i}`, dx + 13, 150);
  }

  // Right Dual Ethernet RJ45 Ports
  const portStartX = 875;
  for (let p = 0; p < 2; p++) {
    const py = 50 + p * 80;
    ctx.fillStyle = '#090a0f';
    ctx.fillRect(portStartX, py, 88, 60);
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 2;
    ctx.strokeRect(portStartX, py, 88, 60);

    // Pins
    ctx.fillStyle = '#eab308';
    ctx.fillRect(portStartX + 20, py + 15, 48, 8);

    // Link LEDs
    ctx.fillStyle = isOnline ? '#10b981' : '#ef4444';
    ctx.beginPath();
    ctx.arc(portStartX + 12, py + 14, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = isOnline ? '#f59e0b' : '#334155';
    ctx.beginPath();
    ctx.arc(portStartX + 76, py + 14, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  return texture;
}

export function SingleRack3DCanvas({
  rackNumber,
  servers,
  doorOpen,
  onToggleDoor,
  selectedServerId,
  onSelectServer,
  soundEnabled,
  onPlaySound,
}: SingleRack3DCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  // Sync state refs so animation loop has instant access without tearing down the Three.js scene!
  const doorOpenRef = useRef(doorOpen);
  const serversRef = useRef(servers);

  useEffect(() => {
    doorOpenRef.current = doorOpen;
  }, [doorOpen]);

  useEffect(() => {
    serversRef.current = servers;
    // Update emissive status on existing meshes when ping updates - NO scene rebuilding!
    servers.forEach((srv) => {
      const entry = serverMeshesRef.current.get(srv.id);
      if (entry) {
        const isOnline = srv.status === 'ONLINE' || srv.online === true;
        const mat = (entry.mesh.material as THREE.Material[])[4] as THREE.MeshStandardMaterial;
        if (mat) {
          mat.emissive.setHex(isOnline ? 0x06b6d4 : 0xef4444);
        }
      }
    });
  }, [servers]);

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const rackGroupRef = useRef<THREE.Group | null>(null);
  const fanBladesRef = useRef<THREE.Group[]>([]);
  const doorPivotRef = useRef<THREE.Group | null>(null);
  const serverMeshesRef = useRef<Map<string, { mesh: THREE.Mesh; defaultZ: number }>>(new Map());

  // Reset Camera View
  const handleResetCamera = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(0, 2.15, 5.6);
    controlsRef.current.target.set(0, 2.15, 0);
    controlsRef.current.update();
    if (onPlaySound && soundEnabled) onPlaySound('click');
  }, [onPlaySound, soundEnabled]);

  // Main Three.js Scene Setup (Runs ONCE on mount or when rackNumber changes)
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x06080d);

    // 2. Camera - Framed perfectly so the full rack from bottom feet to top fans is completely visible (NO CUT OFF!)
    const camera = new THREE.PerspectiveCamera(44, width / height, 0.1, 100);
    camera.position.set(0, 2.15, 5.6);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // 4. OrbitControls - NO 360 rotation! Locked front view
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableRotate = false; // Disables 360 degree rotation
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.target.set(0, 2.15, 0);
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xf1f5f9, 2.2);
    dirLight.position.set(3, 9, 6);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const cyanPoint = new THREE.PointLight(0x06b6d4, 3.8, 9);
    cyanPoint.position.set(0, 2.6, 2.8);
    scene.add(cyanPoint);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    rimLight.position.set(-3, 7, -4);
    scene.add(rimLight);

    // -------------------------------------------------------------------------
    // Construct the 42U Server Rack Model - Snug proportional dimensions
    // -------------------------------------------------------------------------
    const rackGroup = new THREE.Group();
    rackGroup.position.set(0, 0, 0);
    rackGroupRef.current = rackGroup;

    const rackWidth = 2.1;
    const rackHeight = 3.8;
    const rackDepth = 1.45;

    // Steel powder-coat frame material
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x13151c,
      roughness: 0.35,
      metalness: 0.85,
    });

    // Left Side Wall
    const sideWallGeo = new THREE.BoxGeometry(0.06, rackHeight, rackDepth);
    const leftWall = new THREE.Mesh(sideWallGeo, frameMat);
    leftWall.position.set(-rackWidth / 2 + 0.03, rackHeight / 2 + 0.15, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    rackGroup.add(leftWall);

    // Right Side Wall
    const rightWall = leftWall.clone();
    rightWall.position.set(rackWidth / 2 - 0.03, rackHeight / 2 + 0.15, 0);
    rackGroup.add(rightWall);

    // Back Mesh Wall
    const backWallGeo = new THREE.BoxGeometry(rackWidth, rackHeight, 0.04);
    const backWallMat = new THREE.MeshStandardMaterial({ color: 0x090a0f, roughness: 0.9, metalness: 0.5 });
    const backWall = new THREE.Mesh(backWallGeo, backWallMat);
    backWall.position.set(0, rackHeight / 2 + 0.15, -rackDepth / 2 + 0.02);
    rackGroup.add(backWall);

    // Heavy Plinth Base with 4 Leveling Feet
    const plinthGeo = new THREE.BoxGeometry(rackWidth + 0.04, 0.15, rackDepth + 0.04);
    const plinthMat = new THREE.MeshStandardMaterial({ color: 0x030305, roughness: 0.3, metalness: 0.95 });
    const plinth = new THREE.Mesh(plinthGeo, plinthMat);
    plinth.position.set(0, 0.075, 0);
    plinth.castShadow = true;
    rackGroup.add(plinth);

    // 4 Corner Leveling Studs
    const footGeo = new THREE.CylinderGeometry(0.05, 0.06, 0.08, 16);
    const footMat = new THREE.MeshStandardMaterial({ color: 0x71717a, metalness: 0.9, roughness: 0.2 });
    [
      [-rackWidth / 2 + 0.15, 0.04, -rackDepth / 2 + 0.15],
      [rackWidth / 2 - 0.15, 0.04, -rackDepth / 2 + 0.15],
      [-rackWidth / 2 + 0.15, 0.04, rackDepth / 2 - 0.15],
      [rackWidth / 2 - 0.15, 0.04, rackDepth / 2 - 0.15],
    ].forEach(([fx, fy, fz]) => {
      const foot = new THREE.Mesh(footGeo, footMat);
      foot.position.set(fx, fy, fz);
      rackGroup.add(foot);
    });

    // Top Roof Canopy with Dual High-CFM Exhaust Fans
    const roofGeo = new THREE.BoxGeometry(rackWidth + 0.04, 0.2, rackDepth + 0.04);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x1b1d27, roughness: 0.35, metalness: 0.85 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(0, rackHeight + 0.25, 0);
    rackGroup.add(roof);

    // 2 Spinning Exhaust Fans on Roof
    fanBladesRef.current = [];
    const fanWellGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.08, 24);
    const fanWellMat = new THREE.MeshStandardMaterial({ color: 0x050608, roughness: 0.2, metalness: 0.9 });

    [-0.5, 0.5].forEach((fanX) => {
      const fanWell = new THREE.Mesh(fanWellGeo, fanWellMat);
      fanWell.position.set(fanX, rackHeight + 0.36, 0);
      rackGroup.add(fanWell);

      // Cyan Neon Ring under fan
      const cyanRingGeo = new THREE.RingGeometry(0.22, 0.27, 24);
      const cyanRingMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, side: THREE.DoubleSide });
      const cyanRing = new THREE.Mesh(cyanRingGeo, cyanRingMat);
      cyanRing.rotation.x = -Math.PI / 2;
      cyanRing.position.set(fanX, rackHeight + 0.365, 0);
      rackGroup.add(cyanRing);

      // Fan Blades
      const fanGroup = new THREE.Group();
      fanGroup.position.set(fanX, rackHeight + 0.38, 0);

      for (let b = 0; b < 5; b++) {
        const bladeAngle = (b * Math.PI * 2) / 5;
        const bladeGeo = new THREE.BoxGeometry(0.065, 0.01, 0.22);
        const bladeMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.25, metalness: 0.85 });
        const blade = new THREE.Mesh(bladeGeo, bladeMat);
        blade.rotation.y = bladeAngle;
        blade.position.set(Math.sin(bladeAngle) * 0.11, 0, Math.cos(bladeAngle) * 0.11);
        fanGroup.add(blade);
      }

      const hubGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.02, 16);
      const hubMat = new THREE.MeshStandardMaterial({ color: 0x090a0f, metalness: 0.95 });
      const hub = new THREE.Mesh(hubGeo, hubMat);
      fanGroup.add(hub);

      rackGroup.add(fanGroup);
      fanBladesRef.current.push(fanGroup);
    });

    // Top ITV Header Plate
    const headerCanvas = document.createElement('canvas');
    headerCanvas.width = 512;
    headerCanvas.height = 128;
    const hCtx = headerCanvas.getContext('2d');
    if (hCtx) {
      hCtx.fillStyle = '#0a0d14';
      hCtx.fillRect(0, 0, 512, 128);
      hCtx.fillStyle = '#e11d48';
      hCtx.fillRect(16, 24, 12, 80);
      hCtx.fillStyle = '#ffffff';
      hCtx.font = 'bold 44px monospace';
      hCtx.fillText(`ITV RACK ${rackNumber}`, 40, 78);
      hCtx.fillStyle = '#06b6d4';
      hCtx.font = 'bold 22px monospace';
      hCtx.fillText(rackNumber === '01' ? 'CORE ENTERPRISE & NEWSROOM' : 'GRASS VALLEY BROADCAST', 40, 110);
    }
    const headerTex = new THREE.CanvasTexture(headerCanvas);
    const headerGeo = new THREE.PlaneGeometry(rackWidth - 0.1, 0.22);
    const headerMat = new THREE.MeshBasicMaterial({ map: headerTex });
    const headerMesh = new THREE.Mesh(headerGeo, headerMat);
    headerMesh.position.set(0, rackHeight + 0.02, rackDepth / 2 + 0.01);
    rackGroup.add(headerMesh);

    // EIA 19" Vertical Rack Rail Uprights
    const railMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, metalness: 0.9, roughness: 0.3 });
    const railGeo = new THREE.BoxGeometry(0.05, rackHeight - 0.4, 0.05);

    const railLeft = new THREE.Mesh(railGeo, railMat);
    railLeft.position.set(-0.96, (rackHeight - 0.4) / 2 + 0.25, rackDepth / 2 - 0.15);
    rackGroup.add(railLeft);

    const railRight = new THREE.Mesh(railGeo, railMat);
    railRight.position.set(0.96, (rackHeight - 0.4) / 2 + 0.25, rackDepth / 2 - 0.15);
    rackGroup.add(railRight);

    // 7 Server Blades Mounted Inside (Solidly fixed in place - ZERO jumping!)
    serverMeshesRef.current.clear();
    const serverStartY = 0.44;
    const serverSpacing = 0.46;

    servers.forEach((srv, idx) => {
      const isOnline = srv.status === 'ONLINE' || srv.online === true;
      const srvY = serverStartY + idx * serverSpacing;

      // Full-width server blade
      const bladeGeo = new THREE.BoxGeometry(1.88, 0.38, 1.25);
      const faceTex = createFaceplateTexture(srv, isOnline, false);
      const faceMat = new THREE.MeshStandardMaterial({
        map: faceTex,
        metalness: 0.5,
        roughness: 0.4,
        emissive: isOnline ? 0x06b6d4 : 0xef4444,
        emissiveIntensity: 0.06,
      });

      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0x27272a,
        metalness: 0.85,
        roughness: 0.3,
      });

      const materials = [bodyMat, bodyMat, bodyMat, bodyMat, faceMat, bodyMat];
      const serverMesh = new THREE.Mesh(bladeGeo, materials);
      const defaultZ = 0.1;
      serverMesh.position.set(0, srvY, defaultZ);
      serverMesh.castShadow = true;
      serverMesh.receiveShadow = true;

      serverMesh.userData = {
        serverId: srv.id,
        serverData: srv,
      };

      rackGroup.add(serverMesh);
      serverMeshesRef.current.set(srv.id, { mesh: serverMesh, defaultZ });
    });

    // Hinged Glass Door with Suprema Terminal
    const doorPivot = new THREE.Group();
    doorPivot.position.set(-rackWidth / 2 + 0.02, 0, rackDepth / 2 + 0.04);

    const doorWidth = rackWidth - 0.04;
    const doorHeight = rackHeight - 0.1;
    const doorGeo = new THREE.BoxGeometry(doorWidth, doorHeight, 0.02);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.32,
      roughness: 0.08,
      metalness: 0.85,
      transmission: 0.65,
      ior: 1.5,
    });
    const doorMesh = new THREE.Mesh(doorGeo, glassMat);
    doorMesh.position.set(doorWidth / 2, doorHeight / 2 + 0.15, 0);
    doorPivot.add(doorMesh);

    // Frame border
    const frameBorderGeo = new THREE.BoxGeometry(doorWidth + 0.04, doorHeight + 0.04, 0.03);
    const frameBorderMat = new THREE.MeshStandardMaterial({ color: 0x27272a, wireframe: true });
    const frameBorder = new THREE.Mesh(frameBorderGeo, frameBorderMat);
    frameBorder.position.copy(doorMesh.position);
    doorPivot.add(frameBorder);

    // Suprema BioStation Terminal (Mounted on Door at eye level)
    const supremaGeo = new THREE.BoxGeometry(0.14, 0.3, 0.04);
    const supremaMat = new THREE.MeshStandardMaterial({ color: 0x090a0f, roughness: 0.2, metalness: 0.95 });
    const supremaMesh = new THREE.Mesh(supremaGeo, supremaMat);
    supremaMesh.position.set(doorWidth * 0.88, 2.1, 0.025);

    // Glowing Fingerprint Sensor
    const fingerSensorGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.01, 16);
    const fingerSensorMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const fingerSensor = new THREE.Mesh(fingerSensorGeo, fingerSensorMat);
    fingerSensor.rotation.x = Math.PI / 2;
    fingerSensor.position.set(0, 0.05, 0.025);
    supremaMesh.add(fingerSensor);

    // Keypad Screen
    const screenGeo = new THREE.PlaneGeometry(0.1, 0.08);
    const screenMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
    const oledScreen = new THREE.Mesh(screenGeo, screenMat);
    oledScreen.position.set(0, -0.04, 0.025);
    supremaMesh.add(oledScreen);

    doorPivot.add(supremaMesh);
    rackGroup.add(doorPivot);
    doorPivotRef.current = doorPivot;

    scene.add(rackGroup);

    // -------------------------------------------------------------------------
    // Raycasting for Server Clicks (Stationary - ZERO JUMPING!)
    // -------------------------------------------------------------------------
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      const interactiveMeshes: THREE.Mesh[] = [];
      serverMeshesRef.current.forEach((val) => interactiveMeshes.push(val.mesh));

      const intersects = raycaster.intersectObjects(interactiveMeshes, false);
      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const srv = hit.userData.serverData as ServerNode;
        if (srv) {
          // Select server in state - mesh stays 100% solid, NO JUMPING!
          onSelectServer(srv);
          if (onPlaySound && soundEnabled) onPlaySound('click');
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    // -------------------------------------------------------------------------
    // Animation Loop
    // -------------------------------------------------------------------------
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Spin top cooling fans
      fanBladesRef.current.forEach((fan) => {
        fan.rotation.y += delta * 12.0;
      });

      // Hinged Door swing animation
      const targetAngle = doorOpenRef.current ? -Math.PI * 0.48 : 0;
      if (doorPivotRef.current) {
        doorPivotRef.current.rotation.y = THREE.MathUtils.lerp(
          doorPivotRef.current.rotation.y,
          targetAngle,
          delta * 5.0
        );
      }

      // Server blades remain 100% stationary and solidly mounted in their rack slots - ZERO jumping!
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [rackNumber]);

  return (
    <div className="relative w-full h-[680px] sm:h-[750px] rounded-2xl overflow-hidden bg-[#07090e] border-[3px] border-zinc-900 shadow-[0_20px_60px_rgba(0,0,0,0.95)]">
      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-pointer" />

      {/* Floating 3D HUD Controls on Top of Rack */}
      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 pointer-events-none z-30">
        <div className="pointer-events-auto bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-xl border border-zinc-800 text-[9px] font-mono font-bold text-cyan-400 flex items-center gap-1.5 shadow">
          <Sparkles className="h-3 w-3 text-cyan-400 animate-pulse" />
          <span>3D RACK {rackNumber}</span>
        </div>

        <div className="pointer-events-auto flex items-center gap-1.5 bg-black/80 backdrop-blur-md p-1 rounded-xl border border-zinc-800 shadow">
          {/* Toggle Door */}
          <button
            onClick={onToggleDoor}
            className={`px-2.5 py-1 rounded-lg text-[8.5px] font-mono font-bold transition flex items-center gap-1 ${
              doorOpen
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-zinc-800 text-zinc-300 hover:text-white'
            }`}
            title="Toggle 3D Glass Door"
          >
            {doorOpen ? <DoorOpen className="h-3 w-3" /> : <DoorClosed className="h-3 w-3" />}
            <span>{doorOpen ? 'Door Open' : 'Door Shut'}</span>
          </button>

          {/* Reset View */}
          <button
            onClick={handleResetCamera}
            className="p-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition"
            title="Reset Camera Angle"
          >
            <RefreshCw className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Bottom Center Indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none bg-black/75 backdrop-blur-md px-3 py-0.5 rounded-full border border-zinc-800 text-[8.5px] font-mono text-zinc-400">
        ITV ENTERPRISE 42U RACK • CLICK TO SELECT SERVER
      </div>
    </div>
  );
}
