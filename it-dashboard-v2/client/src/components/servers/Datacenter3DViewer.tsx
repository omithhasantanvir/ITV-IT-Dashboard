'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ServerNode } from '@/components/servers/rack/RackTypes';
import {
  RotateCcw,
  DoorOpen,
  DoorClosed,
  Eye,
  Activity,
  Check,
  Copy,
  Radio,
  Server,
  Zap,
  Shield,
  Layers,
  ChevronRight,
  X,
  Volume2,
} from 'lucide-react';

interface Datacenter3DViewerProps {
  servers: ServerNode[];
  onPingSingle?: (srv: ServerNode) => void;
  onCopyIp?: (ip: string) => void;
  copiedIp?: string | null;
  soundEnabled?: boolean;
  onPlaySound?: (type: 'beep' | 'door' | 'slide' | 'alert' | 'click') => void;
  onRequestDoorAuth?: (rackNumber: string) => void;
}

// Generate photorealistic dynamic texture for server faceplate
function createServerFaceplateTexture(
  server: ServerNode,
  isOnline: boolean,
  isSelected: boolean
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Background chassis gradient (dark brushed metal)
  const bgGrad = ctx.createLinearGradient(0, 0, 0, 256);
  bgGrad.addColorStop(0, '#1c1f28');
  bgGrad.addColorStop(0.3, '#101217');
  bgGrad.addColorStop(0.7, '#0a0c10');
  bgGrad.addColorStop(1, '#161922');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1024, 256);

  // Subtle metallic horizontal brush lines
  ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
  for (let y = 0; y < 256; y += 3) {
    ctx.fillRect(0, y, 1024, 1);
  }

  // Border highlight
  ctx.strokeStyle = isSelected ? '#06b6d4' : isOnline ? '#27272a' : '#7f1d1d';
  ctx.lineWidth = isSelected ? 8 : 4;
  ctx.strokeRect(4, 4, 1016, 248);

  // Left Server Handle (Brushed Aluminum)
  ctx.fillStyle = '#3f3f46';
  ctx.fillRect(16, 20, 24, 216);
  ctx.fillStyle = '#71717a';
  ctx.fillRect(20, 24, 6, 208);

  // Right Server Handle
  ctx.fillStyle = '#3f3f46';
  ctx.fillRect(984, 20, 24, 216);
  ctx.fillStyle = '#71717a';
  ctx.fillRect(988, 24, 6, 208);

  // LCD Diagnostic Screen (Left-Center)
  const lcdGrad = ctx.createLinearGradient(60, 40, 60, 216);
  lcdGrad.addColorStop(0, '#020617');
  lcdGrad.addColorStop(1, '#0f172a');
  ctx.fillStyle = lcdGrad;
  ctx.fillRect(60, 40, 360, 176);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 3;
  ctx.strokeRect(60, 40, 360, 176);

  // Screen Content
  ctx.fillStyle = '#06b6d4';
  ctx.font = 'bold 24px monospace';
  ctx.fillText('ITV ENTERPRISE NODE', 80, 76);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px monospace';
  const nameTruncated = (server.serverName || 'SERVER').toUpperCase();
  ctx.fillText(nameTruncated.substring(0, 16), 80, 124);

  ctx.font = '24px monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(server.ipAddress || '172.19.4.x', 80, 162);

  // Status Badge on LCD
  ctx.fillStyle = isOnline ? '#10b981' : '#ef4444';
  ctx.beginPath();
  ctx.arc(84, 192, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = 'bold 20px monospace';
  ctx.fillStyle = isOnline ? '#34d399' : '#f87171';
  ctx.fillText(isOnline ? 'ONLINE • 1ms' : 'OFFLINE • TIMEOUT', 104, 198);

  // 8x Hot-Swap Drive Bays (Center-Right)
  const driveStartX = 450;
  for (let i = 0; i < 8; i++) {
    const dx = driveStartX + i * 50;
    // Drive Bay Caddy
    ctx.fillStyle = '#18181b';
    ctx.fillRect(dx, 40, 42, 176);
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 2;
    ctx.strokeRect(dx, 40, 42, 176);

    // Drive Handle / Latch
    ctx.fillStyle = '#27272a';
    ctx.fillRect(dx + 6, 170, 30, 36);

    // Drive Activity LED (Blinking amber/green simulation)
    const ledColor = isOnline ? (i % 2 === 0 ? '#10b981' : '#f59e0b') : '#7f1d1d';
    ctx.fillStyle = ledColor;
    ctx.beginPath();
    ctx.arc(dx + 21, 56, 4, 0, Math.PI * 2);
    ctx.fill();

    // Drive Number
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#71717a';
    ctx.fillText(`D${i}`, dx + 13, 150);
  }

  // Right Ventilation Honeycomb & Ethernet RJ45 Ports
  const portStartX = 870;
  // Dual 10G SFP+ / RJ45 Ports
  for (let p = 0; p < 2; p++) {
    const py = 50 + p * 80;
    ctx.fillStyle = '#090a0f';
    ctx.fillRect(portStartX, py, 90, 60);
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 2;
    ctx.strokeRect(portStartX, py, 90, 60);

    // RJ45 Pins
    ctx.fillStyle = '#eab308';
    ctx.fillRect(portStartX + 20, py + 15, 50, 8);

    // Link LEDs
    ctx.fillStyle = isOnline ? '#10b981' : '#ef4444';
    ctx.beginPath();
    ctx.arc(portStartX + 12, py + 14, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = isOnline ? '#f59e0b' : '#334155';
    ctx.beginPath();
    ctx.arc(portStartX + 78, py + 14, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  return texture;
}

export function Datacenter3DViewer({
  servers,
  onPingSingle,
  onCopyIp,
  copiedIp,
  soundEnabled,
  onPlaySound,
  onRequestDoorAuth,
}: Datacenter3DViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedServer, setSelectedServer] = useState<ServerNode | null>(null);
  const [doorsOpen, setDoorsOpen] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [cameraView, setCameraView] = useState<'iso' | 'front' | 'rack1' | 'rack2' | 'top'>('iso');

  // Internal Three.js references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const fanBladesRef = useRef<THREE.Group[]>([]);
  const doorPivot1Ref = useRef<THREE.Group | null>(null);
  const doorPivot2Ref = useRef<THREE.Group | null>(null);
  const serverMeshesRef = useRef<Map<string, { mesh: THREE.Mesh; defaultZ: number }>>(new Map());

  // Split servers into Rack 01 (first 7) and Rack 02 (next 7)
  const rack1Servers = servers.slice(0, 7);
  const rack2Servers = servers.slice(7, 14);

  // Toggle Doors state
  const handleToggleDoors = () => {
    const next = !doorsOpen;
    setDoorsOpen(next);
    if (onPlaySound && soundEnabled) onPlaySound('door');
  };

  // Camera preset transitions
  const setCameraPreset = useCallback(
    (view: 'iso' | 'front' | 'rack1' | 'rack2' | 'top') => {
      setCameraView(view);
      if (!cameraRef.current || !controlsRef.current) return;
      const controls = controlsRef.current;
      const camera = cameraRef.current;

      let targetPos = new THREE.Vector3();
      let lookPos = new THREE.Vector3(0, 1.8, 0);

      switch (view) {
        case 'iso':
          targetPos.set(4.5, 4.0, 6.5);
          lookPos.set(0, 1.8, 0);
          break;
        case 'front':
          targetPos.set(0, 2.0, 6.2);
          lookPos.set(0, 1.8, 0);
          break;
        case 'rack1':
          targetPos.set(-1.8, 2.0, 3.8);
          lookPos.set(-1.6, 2.0, 0);
          break;
        case 'rack2':
          targetPos.set(1.8, 2.0, 3.8);
          lookPos.set(1.6, 2.0, 0);
          break;
        case 'top':
          targetPos.set(0, 7.5, 1.0);
          lookPos.set(0, 3.0, 0);
          break;
      }

      // Smooth lerp or direct set
      camera.position.copy(targetPos);
      controls.target.copy(lookPos);
      controls.update();

      if (onPlaySound && soundEnabled) onPlaySound('click');
    },
    [onPlaySound, soundEnabled]
  );

  // -------------------------------------------------------------------------
  // Main Three.js Scene Setup & Loop
  // -------------------------------------------------------------------------
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x07090e);
    scene.fog = new THREE.FogExp2(0x07090e, 0.035);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(4.5, 4.0, 6.5);
    cameraRef.current = camera;

    // 3. Renderer with antialiasing & tone mapping
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.02; // Can't go below floor
    controls.minDistance = 2.0;
    controls.maxDistance = 16.0;
    controls.target.set(0, 1.8, 0);
    controlsRef.current = controls;

    // 5. Lighting
    // Ambient fill
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    // Main Overhead Directional Light
    const dirLight = new THREE.DirectionalLight(0xe2e8f0, 1.8);
    dirLight.position.set(6, 12, 8);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.bias = -0.0001;
    scene.add(dirLight);

    // Cold-Aisle Cyan Neon Fill Light
    const cyanLight = new THREE.PointLight(0x06b6d4, 3.5, 12);
    cyanLight.position.set(0, 2.5, 3.2);
    scene.add(cyanLight);

    // Subtle blue rim back-light
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    rimLight.position.set(-6, 8, -6);
    scene.add(rimLight);

    // 6. Datacenter Raised Floor
    const floorGeo = new THREE.PlaneGeometry(40, 40);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0c0f17,
      roughness: 0.55,
      metalness: 0.35,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Cybernetic Grid Overlay on Floor
    const grid = new THREE.GridHelper(30, 30, 0x06b6d4, 0x1e293b);
    grid.position.y = 0.005;
    scene.add(grid);

    // Ceiling Cable Trays / Overhead Rails
    const cableTrayGeo = new THREE.BoxGeometry(7, 0.08, 0.6);
    const cableTrayMat = new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.8, roughness: 0.3 });
    const cableTray = new THREE.Mesh(cableTrayGeo, cableTrayMat);
    cableTray.position.set(0, 4.2, 0);
    scene.add(cableTray);

    // -------------------------------------------------------------------------
    // Helper to build 42U Server Rack Cabinet
    // -------------------------------------------------------------------------
    fanBladesRef.current = [];
    serverMeshesRef.current.clear();

    const buildCabinet = (
      rackNumber: '01' | '02',
      xOffset: number,
      rackServers: ServerNode[],
      onDoorPivotReady: (pivot: THREE.Group) => void
    ) => {
      const rackGroup = new THREE.Group();
      rackGroup.position.set(xOffset, 0, 0);

      // Inward slight tilt towards center aisle
      rackGroup.rotation.y = rackNumber === '01' ? -0.05 : 0.05;

      const rackWidth = 1.15;
      const rackHeight = 2.85;
      const rackDepth = 1.5;

      // 1. Outer Frame (Steel matte charcoal enclosure)
      const frameMat = new THREE.MeshStandardMaterial({
        color: 0x12141a,
        roughness: 0.45,
        metalness: 0.8,
      });

      // Side Wall Left
      const sideWallGeo = new THREE.BoxGeometry(0.06, rackHeight, rackDepth);
      const leftWall = new THREE.Mesh(sideWallGeo, frameMat);
      leftWall.position.set(-rackWidth / 2 + 0.03, rackHeight / 2 + 0.15, 0);
      leftWall.castShadow = true;
      leftWall.receiveShadow = true;
      rackGroup.add(leftWall);

      // Side Wall Right
      const rightWall = leftWall.clone();
      rightWall.position.set(rackWidth / 2 - 0.03, rackHeight / 2 + 0.15, 0);
      rackGroup.add(rightWall);

      // Back Perforated Mesh Wall
      const backWallGeo = new THREE.BoxGeometry(rackWidth, rackHeight, 0.04);
      const backWallMat = new THREE.MeshStandardMaterial({
        color: 0x090b10,
        roughness: 0.8,
        metalness: 0.6,
      });
      const backWall = new THREE.Mesh(backWallGeo, backWallMat);
      backWall.position.set(0, rackHeight / 2 + 0.15, -rackDepth / 2 + 0.02);
      rackGroup.add(backWall);

      // 2. Heavy-Duty Bottom Plinth & 4 Leveling Studs
      const plinthGeo = new THREE.BoxGeometry(rackWidth + 0.08, 0.15, rackDepth + 0.08);
      const plinthMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.3, metalness: 0.9 });
      const plinth = new THREE.Mesh(plinthGeo, plinthMat);
      plinth.position.set(0, 0.075, 0);
      plinth.castShadow = true;
      rackGroup.add(plinth);

      // 4 Leveling Studs at corners
      const footGeo = new THREE.CylinderGeometry(0.05, 0.06, 0.1, 16);
      const footMat = new THREE.MeshStandardMaterial({ color: 0x52525b, metalness: 0.9, roughness: 0.2 });
      const footPositions = [
        [-rackWidth / 2 + 0.1, 0.05, -rackDepth / 2 + 0.1],
        [rackWidth / 2 - 0.1, 0.05, -rackDepth / 2 + 0.1],
        [-rackWidth / 2 + 0.1, 0.05, rackDepth / 2 - 0.1],
        [rackWidth / 2 - 0.1, 0.05, rackDepth / 2 - 0.1],
      ];
      footPositions.forEach(([fx, fy, fz]) => {
        const foot = new THREE.Mesh(footGeo, footMat);
        foot.position.set(fx, fy, fz);
        rackGroup.add(foot);
      });

      // 3. Top Roof Canopy with Dual High-CFM Exhaust Fans
      const roofCanopyGeo = new THREE.BoxGeometry(rackWidth + 0.04, 0.2, rackDepth + 0.04);
      const roofMat = new THREE.MeshStandardMaterial({
        color: 0x181a24,
        roughness: 0.35,
        metalness: 0.85,
      });
      const roof = new THREE.Mesh(roofCanopyGeo, roofMat);
      roof.position.set(0, rackHeight + 0.25, 0);
      rackGroup.add(roof);

      // 2 Exhaust Fans on Roof
      const fanWellGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.08, 24);
      const fanWellMat = new THREE.MeshStandardMaterial({ color: 0x050608, roughness: 0.2, metalness: 0.9 });

      const fanPositions = [-0.35, 0.35];
      fanPositions.forEach((fanX) => {
        const fanWell = new THREE.Mesh(fanWellGeo, fanWellMat);
        fanWell.position.set(fanX, rackHeight + 0.36, 0);
        rackGroup.add(fanWell);

        // Cyan LED ring under fan
        const cyanRingGeo = new THREE.RingGeometry(0.2, 0.24, 24);
        const cyanRingMat = new THREE.MeshBasicMaterial({
          color: 0x06b6d4,
          side: THREE.DoubleSide,
        });
        const cyanRing = new THREE.Mesh(cyanRingGeo, cyanRingMat);
        cyanRing.rotation.x = -Math.PI / 2;
        cyanRing.position.set(fanX, rackHeight + 0.365, 0);
        rackGroup.add(cyanRing);

        // Fan Blades Group
        const fanGroup = new THREE.Group();
        fanGroup.position.set(fanX, rackHeight + 0.38, 0);

        // 5 Blades
        for (let b = 0; b < 5; b++) {
          const bladeAngle = (b * Math.PI * 2) / 5;
          const bladeGeo = new THREE.BoxGeometry(0.06, 0.01, 0.2);
          const bladeMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.3, metalness: 0.8 });
          const blade = new THREE.Mesh(bladeGeo, bladeMat);
          blade.rotation.y = bladeAngle;
          blade.position.set(Math.sin(bladeAngle) * 0.1, 0, Math.cos(bladeAngle) * 0.1);
          fanGroup.add(blade);
        }
        // Center hub
        const hubGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.02, 16);
        const hubMat = new THREE.MeshStandardMaterial({ color: 0x090a0f, metalness: 0.9 });
        const hub = new THREE.Mesh(hubGeo, hubMat);
        fanGroup.add(hub);

        rackGroup.add(fanGroup);
        fanBladesRef.current.push(fanGroup);
      });

      // 4. Rack Header Plate ("ITV RACK 01 / 02")
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
        hCtx.font = 'bold 24px monospace';
        hCtx.fillText(rackNumber === '01' ? 'CORE NEWSROOM' : 'GRASS VALLEY BROADCAST', 40, 110);
      }
      const headerTex = new THREE.CanvasTexture(headerCanvas);
      const headerGeo = new THREE.PlaneGeometry(rackWidth - 0.1, 0.22);
      const headerMat = new THREE.MeshBasicMaterial({ map: headerTex });
      const headerMesh = new THREE.Mesh(headerGeo, headerMat);
      headerMesh.position.set(0, rackHeight + 0.02, rackDepth / 2 + 0.01);
      rackGroup.add(headerMesh);

      // 5. EIA 19" Vertical Rack Rail Uprights (with RU ticks)
      const railMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, metalness: 0.9, roughness: 0.3 });
      const railGeo = new THREE.BoxGeometry(0.04, rackHeight - 0.4, 0.04);

      const railLeft = new THREE.Mesh(railGeo, railMat);
      railLeft.position.set(-rackWidth / 2 + 0.08, (rackHeight - 0.4) / 2 + 0.25, rackDepth / 2 - 0.15);
      rackGroup.add(railLeft);

      const railRight = new THREE.Mesh(railGeo, railMat);
      railRight.position.set(rackWidth / 2 - 0.08, (rackHeight - 0.4) / 2 + 0.25, rackDepth / 2 - 0.15);
      rackGroup.add(railRight);

      // 6. 7 Server Blades Mounted Inside
      const serverStartY = 0.35;
      const serverSpacing = 0.34;

      rackServers.forEach((srv, idx) => {
        const isOnline = srv.status === 'ONLINE' || srv.online === true;
        const srvY = serverStartY + idx * serverSpacing;

        // Server Blade Chassis Box
        const bladeGeo = new THREE.BoxGeometry(0.96, 0.24, 1.25);

        // Faceplate material with custom dynamic canvas texture
        const faceTex = createServerFaceplateTexture(srv, isOnline, selectedServer?.id === srv.id);
        const faceMat = new THREE.MeshStandardMaterial({
          map: faceTex,
          metalness: 0.5,
          roughness: 0.4,
          emissive: isOnline ? 0x06b6d4 : 0xef4444,
          emissiveIntensity: 0.06,
        });

        // Other sides of server
        const bodyMat = new THREE.MeshStandardMaterial({
          color: 0x27272a,
          metalness: 0.85,
          roughness: 0.3,
        });

        const materials = [
          bodyMat, // right
          bodyMat, // left
          bodyMat, // top
          bodyMat, // bottom
          faceMat, // front
          bodyMat, // back
        ];

        const serverMesh = new THREE.Mesh(bladeGeo, materials);
        const defaultZ = 0.1;
        serverMesh.position.set(0, srvY, defaultZ);
        serverMesh.castShadow = true;
        serverMesh.receiveShadow = true;

        // Custom metadata for raycasting
        serverMesh.userData = {
          serverId: srv.id,
          serverData: srv,
          rackNumber,
        };

        rackGroup.add(serverMesh);
        serverMeshesRef.current.set(srv.id, { mesh: serverMesh, defaultZ });
      });

      // 7. Hinged Glass Door with Suprema BioStation Terminal
      // Pivot is located at the front-left edge of the rack cabinet
      const doorPivot = new THREE.Group();
      doorPivot.position.set(-rackWidth / 2 + 0.02, 0, rackDepth / 2 + 0.04);

      // Glass door pane
      const doorWidth = rackWidth - 0.06;
      const doorHeight = rackHeight - 0.1;
      const doorGeo = new THREE.BoxGeometry(doorWidth, doorHeight, 0.02);
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0x06b6d4,
        transparent: true,
        opacity: 0.35,
        roughness: 0.08,
        metalness: 0.85,
        transmission: 0.6,
        ior: 1.5,
      });
      const doorMesh = new THREE.Mesh(doorGeo, glassMat);
      // Offset mesh so its left edge sits exactly at the pivot point
      doorMesh.position.set(doorWidth / 2, doorHeight / 2 + 0.15, 0);
      doorPivot.add(doorMesh);

      // Door Aluminum Frame Border
      const frameBorderGeo = new THREE.BoxGeometry(doorWidth + 0.04, doorHeight + 0.04, 0.03);
      const frameBorderMat = new THREE.MeshStandardMaterial({
        color: 0x27272a,
        wireframe: true,
      });
      const frameBorder = new THREE.Mesh(frameBorderGeo, frameBorderMat);
      frameBorder.position.copy(doorMesh.position);
      doorPivot.add(frameBorder);

      // Suprema BioStation Access Terminal (Mounted on Door at eye level, x: doorWidth * 0.85, y: 2.1)
      const supremaGeo = new THREE.BoxGeometry(0.12, 0.28, 0.04);
      const supremaMat = new THREE.MeshStandardMaterial({
        color: 0x090a0f,
        roughness: 0.2,
        metalness: 0.9,
      });
      const supremaMesh = new THREE.Mesh(supremaGeo, supremaMat);
      supremaMesh.position.set(doorWidth * 0.82, doorHeight * 0.58, 0.025);

      // Glowing Suprema Fingerprint Scanner Sensor (Green/Cyan)
      const fingerSensorGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.01, 16);
      const fingerSensorMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
      const fingerSensor = new THREE.Mesh(fingerSensorGeo, fingerSensorMat);
      fingerSensor.rotation.x = Math.PI / 2;
      fingerSensor.position.set(0, 0.05, 0.025);
      supremaMesh.add(fingerSensor);

      // Suprema Keypad OLED Screen
      const screenGeo = new THREE.PlaneGeometry(0.09, 0.08);
      const screenMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
      const oledScreen = new THREE.Mesh(screenGeo, screenMat);
      oledScreen.position.set(0, -0.04, 0.025);
      supremaMesh.add(oledScreen);

      doorPivot.add(supremaMesh);

      rackGroup.add(doorPivot);
      onDoorPivotReady(doorPivot);

      scene.add(rackGroup);
    };

    // Build Rack 01 at x: -1.75
    buildCabinet('01', -1.75, rack1Servers, (pivot) => {
      doorPivot1Ref.current = pivot;
    });

    // Build Rack 02 at x: 1.75
    buildCabinet('02', 1.75, rack2Servers, (pivot) => {
      doorPivot2Ref.current = pivot;
    });

    // -------------------------------------------------------------------------
    // Raycasting for Server Clicks / Hover
    // -------------------------------------------------------------------------
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      // Raycast against all server meshes in scene
      const interactiveMeshes: THREE.Mesh[] = [];
      serverMeshesRef.current.forEach((val) => interactiveMeshes.push(val.mesh));

      const intersects = raycaster.intersectObjects(interactiveMeshes, false);
      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const srv = hit.userData.serverData as ServerNode;
        if (srv) {
          setSelectedServer(srv);
          if (onPlaySound && soundEnabled) onPlaySound('slide');
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

      // Spin top cooling fans at high RPM
      fanBladesRef.current.forEach((fan) => {
        fan.rotation.y += delta * 12.0;
      });

      // Animate Hinged Doors (Smooth swing open/close to -105 degrees)
      const targetAngle = doorsOpen ? -Math.PI * 0.58 : 0;
      if (doorPivot1Ref.current) {
        doorPivot1Ref.current.rotation.y = THREE.MathUtils.lerp(
          doorPivot1Ref.current.rotation.y,
          targetAngle,
          delta * 4.5
        );
      }
      if (doorPivot2Ref.current) {
        doorPivot2Ref.current.rotation.y = THREE.MathUtils.lerp(
          doorPivot2Ref.current.rotation.y,
          targetAngle,
          delta * 4.5
        );
      }

      // Animate selected server sliding forward slightly (drawer pull-out effect)
      serverMeshesRef.current.forEach(({ mesh, defaultZ }, id) => {
        const isSelected = selectedServer?.id === id;
        const targetZ = isSelected ? defaultZ + 0.35 : defaultZ;
        mesh.position.z = THREE.MathUtils.lerp(mesh.position.z, targetZ, delta * 8.0);
      });

      // Auto-rotate 360° mode
      if (autoRotate && controlsRef.current) {
        controlsRef.current.autoRotate = true;
        controlsRef.current.autoRotateSpeed = 1.4;
      } else if (controlsRef.current) {
        controlsRef.current.autoRotate = false;
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
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
  }, [rack1Servers, rack2Servers, doorsOpen, autoRotate, onPlaySound, soundEnabled]);

  return (
    <div className="relative w-full h-[650px] sm:h-[750px] lg:h-[820px] rounded-3xl overflow-hidden border border-zinc-800 bg-[#06070a] shadow-[0_25px_60px_rgba(0,0,0,0.95)] select-none">
      {/* Three.js Canvas Mount */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* ---------------------------------------------------------------------
          TOP HUD OVERLAY: 3D Camera Angles & Controls
          --------------------------------------------------------------------- */}
      <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Left: Datacenter Branding & Status */}
        <div className="pointer-events-auto bg-black/75 backdrop-blur-md px-4 py-2 rounded-2xl border border-zinc-800/80 shadow-lg flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Server className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-white tracking-wider">
                ITV DATACENTER 3D WEBGL
              </span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                360° LIVE
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
              Click & drag to rotate • Scroll to zoom • Click server to pull blade
            </p>
          </div>
        </div>

        {/* Right: Camera Presets & Door Switch */}
        <div className="pointer-events-auto flex items-center gap-2 bg-black/75 backdrop-blur-md p-1.5 rounded-2xl border border-zinc-800/80 shadow-lg">
          {/* Preset Buttons */}
          <button
            onClick={() => setCameraPreset('iso')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition flex items-center gap-1.5 ${
              cameraView === 'iso'
                ? 'bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
            title="Isometric Overview"
          >
            <Eye className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Overview</span>
          </button>

          <button
            onClick={() => setCameraPreset('front')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition flex items-center gap-1.5 ${
              cameraView === 'front'
                ? 'bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
            title="Front Cold-Aisle"
          >
            <span>Front</span>
          </button>

          <button
            onClick={() => setCameraPreset('rack1')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition flex items-center gap-1.5 ${
              cameraView === 'rack1'
                ? 'bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
            title="Focus Rack 01"
          >
            <span>Rack 01</span>
          </button>

          <button
            onClick={() => setCameraPreset('rack2')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition flex items-center gap-1.5 ${
              cameraView === 'rack2'
                ? 'bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
            title="Focus Rack 02"
          >
            <span>Rack 02</span>
          </button>

          <div className="h-4 w-px bg-zinc-700 mx-1" />

          {/* Toggle Doors */}
          <button
            onClick={handleToggleDoors}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
              doorsOpen
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
            title="Toggle Tinted Glass Doors Open or Closed"
          >
            {doorsOpen ? <DoorOpen className="h-3.5 w-3.5" /> : <DoorClosed className="h-3.5 w-3.5" />}
            <span>{doorsOpen ? 'Doors Open' : 'Doors Shut'}</span>
          </button>

          {/* 360 Auto-Rotate Toggle */}
          <button
            onClick={() => {
              setAutoRotate(!autoRotate);
              if (onPlaySound && soundEnabled) onPlaySound('click');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
              autoRotate
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
            title="Toggle 360° Continuous Orbit Rotation"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Auto 360°</span>
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------------------------
          BOTTOM HUD: Selected Server Drawer Telemetry Card
          --------------------------------------------------------------------- */}
      {selectedServer && (
        <div className="absolute bottom-5 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 bg-zinc-950/95 backdrop-blur-xl p-4 rounded-2xl border border-cyan-500/50 shadow-[0_10px_40px_rgba(0,0,0,0.9)] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    selectedServer.status === 'ONLINE' || selectedServer.online === true
                      ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                      : 'bg-rose-500 animate-ping'
                  }`}
                />
                <h3 className="font-mono font-bold text-sm text-white tracking-tight">
                  {selectedServer.serverName}
                </h3>
              </div>
              <p className="text-xs font-mono text-cyan-400 mt-0.5">
                {selectedServer.ipAddress || '172.19.4.x'}
              </p>
            </div>

            <button
              onClick={() => setSelectedServer(null)}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              title="Close drawer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3 text-[11px] font-mono">
            <div className="p-2 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
              <span className="text-zinc-500 block text-[9.5px]">ROLE</span>
              <span className="text-zinc-200 font-semibold truncate block">
                {selectedServer.serverType || 'Host Node'}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
              <span className="text-zinc-500 block text-[9.5px]">LATENCY</span>
              <span className="text-emerald-400 font-bold block">
                {selectedServer.latencyMs ? `${selectedServer.latencyMs} ms` : '< 1 ms'}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
              <span className="text-zinc-500 block text-[9.5px]">OS</span>
              <span className="text-zinc-200 font-semibold truncate block">
                {selectedServer.operatingSystem || 'Linux / WinSrv'}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
              <span className="text-zinc-500 block text-[9.5px]">LOCATION</span>
              <span className="text-zinc-200 font-semibold truncate block">
                {selectedServer.location || 'ITV Server Rack'}
              </span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-800/80">
            {onPingSingle && (
              <button
                onClick={() => onPingSingle(selectedServer)}
                className="flex-1 py-1.5 px-3 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 text-xs font-mono font-bold hover:bg-cyan-500/30 transition flex items-center justify-center gap-1.5"
              >
                <Radio className="h-3.5 w-3.5" />
                <span>Ping Node</span>
              </button>
            )}

            {onCopyIp && selectedServer.ipAddress && (
              <button
                onClick={() => onCopyIp(selectedServer.ipAddress!)}
                className="py-1.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-mono transition flex items-center gap-1.5"
                title="Copy IP"
              >
                {copiedIp === selectedServer.ipAddress ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400 text-[11px]">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span className="text-[11px]">Copy IP</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Bottom Center Navigation Helper Tip */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none hidden md:flex items-center gap-3 px-3 py-1 rounded-full bg-black/60 border border-zinc-800/60 backdrop-blur-md text-[10px] font-mono text-zinc-400">
        <span>🖱️ Left-Click + Drag: Rotate 360°</span>
        <span className="text-zinc-700">•</span>
        <span>🖱️ Right-Click + Drag: Pan</span>
        <span className="text-zinc-700">•</span>
        <span>🔍 Scroll: Zoom In/Out</span>
      </div>
    </div>
  );
}
