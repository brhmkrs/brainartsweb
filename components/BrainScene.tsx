"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

// Beyin şekli fonksiyonu - anatomik yapı
function brainShape(u: number, v: number, target: THREE.Vector3) {
  // u: 0-1 (yatay), v: 0-1 (dikey)
  const theta = u * Math.PI * 2;
  const phi = v * Math.PI;

  // Temel küre
  let x = Math.sin(phi) * Math.cos(theta);
  let y = Math.cos(phi);
  let z = Math.sin(phi) * Math.sin(theta);

  // Beyin şekli deformasyonları
  // 1. Yatay genişlik (beyin geniş)
  x *= 1.3;

  // 2. Dikey sıkıştırma (beyin yassı)
  y *= 0.85;

  // 3. Ön-arka uzunluk
  z *= 1.1;

  // 4. Ortadan yarık (iki hemisfer)
  const splitDepth = 0.15 * Math.exp(-Math.pow(z * 3, 2)) * Math.abs(Math.cos(phi));
  x -= Math.sign(x) * splitDepth;

  // 5. Frontal lob çıkıntısı (ön)
  if (z > 0.3) {
    const frontalBulge = 0.2 * Math.exp(-Math.pow((z - 0.7) * 3, 2));
    z += frontalBulge;
  }

  // 6. Temporal lob (yan çıkıntılar)
  const temporalBulge = 0.15 * Math.exp(-Math.pow(y + 0.3, 2) * 5) * Math.abs(x);
  x += Math.sign(x) * temporalBulge;

  // 7. Beyin kıvrımları (gyri) - yüzey dalgalanması
  const gyriNoise = 0.08 * Math.sin(theta * 8) * Math.sin(phi * 6);
  const radius = 1 + gyriNoise;

  target.set(x * radius * 3, y * radius * 3, z * radius * 3);
}

// Ana beyin partikül sistemi
function BrainParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = 15000; // Yüksek yoğunluk

  const { positions, colors, originalPositions } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const originalPositions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const target = new THREE.Vector3();

    for (let i = 0; i < particleCount; i++) {
      // Beyin yüzeyinde rastgele nokta
      const u = Math.random();
      const v = Math.random();
      brainShape(u, v, target);

      // Yüzey + iç hacim (rastgele derinlik)
      const depth = 0.7 + Math.random() * 0.3; // %70-100 derinlik
      const x = target.x * depth;
      const y = target.y * depth;
      const z = target.z * depth;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Orijinal pozisyonları sakla (animasyon için)
      originalPositions[i * 3] = x;
      originalPositions[i * 3 + 1] = y;
      originalPositions[i * 3 + 2] = z;

      // Bölgeye göre renk
      const distFromCenter = Math.sqrt(x * x + y * y + z * z);
      const normalizedDist = distFromCenter / 4;

      // Dış yüzey: parlak, iç: koyu
      if (normalizedDist > 0.85) {
        // Dış korteks - parlak beyaz/mavi
        colors[i * 3] = 0.85 + Math.random() * 0.15;
        colors[i * 3 + 1] = 0.9 + Math.random() * 0.1;
        colors[i * 3 + 2] = 1.0;
      } else if (normalizedDist > 0.6) {
        // Orta katman - açık mavi
        colors[i * 3] = 0.5 + Math.random() * 0.2;
        colors[i * 3 + 1] = 0.7 + Math.random() * 0.15;
        colors[i * 3 + 2] = 0.95 + Math.random() * 0.05;
      } else {
        // İç çekirdek - mor/koyu mavi
        colors[i * 3] = 0.4 + Math.random() * 0.3;
        colors[i * 3 + 1] = 0.3 + Math.random() * 0.2;
        colors[i * 3 + 2] = 0.8 + Math.random() * 0.2;
      }
    }

    return { positions, colors, originalPositions };
  }, []);

  // Partikül animasyonu - nöron aktivitesi
  useFrame((state) => {
    if (pointsRef.current) {
      const time = state.clock.elapsedTime;
      const positionArray = pointsRef.current.geometry.attributes.position.array as Float32Array;

      // Her partikül için mikro hareket
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const ox = originalPositions[i3];
        const oy = originalPositions[i3 + 1];
        const oz = originalPositions[i3 + 2];

        // Sinüzoidal titreşim (nöron aktivitesi simülasyonu)
        const freq = 0.5 + (i % 100) * 0.01;
        const amp = 0.02 + Math.random() * 0.01;

        positionArray[i3] = ox + Math.sin(time * freq + i) * amp;
        positionArray[i3 + 1] = oy + Math.cos(time * freq * 0.7 + i) * amp;
        positionArray[i3 + 2] = oz + Math.sin(time * freq * 0.5 + i * 0.5) * amp;
      }

      pointsRef.current.geometry.attributes.position.needsUpdate = true;

      // Yavaş rotasyon
      pointsRef.current.rotation.y = time * 0.05;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        vertexColors
        transparent
        opacity={0.85}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// Nöral bağlantılar - sinaps efekti
function NeuralConnections() {
  const linesRef = useRef<THREE.LineSegments>(null);
  const connectionCount = 500;

  const positions = useMemo(() => {
    const positions = new Float32Array(connectionCount * 6);
    const target1 = new THREE.Vector3();
    const target2 = new THREE.Vector3();

    for (let i = 0; i < connectionCount; i++) {
      // İki yakın nokta arasında bağlantı
      const u1 = Math.random();
      const v1 = Math.random();
      brainShape(u1, v1, target1);

      // Yakın ikinci nokta
      const u2 = u1 + (Math.random() - 0.5) * 0.1;
      const v2 = v1 + (Math.random() - 0.5) * 0.1;
      brainShape(u2, v2, target2);

      const depth1 = 0.75 + Math.random() * 0.25;
      const depth2 = 0.75 + Math.random() * 0.25;

      positions[i * 6] = target1.x * depth1;
      positions[i * 6 + 1] = target1.y * depth1;
      positions[i * 6 + 2] = target1.z * depth1;
      positions[i * 6 + 3] = target2.x * depth2;
      positions[i * 6 + 4] = target2.y * depth2;
      positions[i * 6 + 5] = target2.z * depth2;
    }

    return positions;
  }, []);

  useFrame((state) => {
    if (linesRef.current) {
      linesRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <lineSegments ref={linesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial
        color="#6699ff"
        transparent
        opacity={0.12}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  );
}

// Aktif bölge parıltıları (ateşlenen nöronlar)
function ActiveRegions() {
  const pointsRef = useRef<THREE.Points>(null);
  const glowCount = 50;

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(glowCount * 3);
    const colors = new Float32Array(glowCount * 3);
    const target = new THREE.Vector3();

    for (let i = 0; i < glowCount; i++) {
      brainShape(Math.random(), Math.random(), target);
      const depth = 0.8 + Math.random() * 0.2;

      positions[i * 3] = target.x * depth;
      positions[i * 3 + 1] = target.y * depth;
      positions[i * 3 + 2] = target.z * depth;

      // Parlak renkler
      const hue = Math.random();
      if (hue < 0.5) {
        // Cyan
        colors[i * 3] = 0.2;
        colors[i * 3 + 1] = 0.9;
        colors[i * 3 + 2] = 1.0;
      } else {
        // Magenta
        colors[i * 3] = 0.9;
        colors[i * 3 + 1] = 0.3;
        colors[i * 3 + 2] = 1.0;
      }
    }

    return { positions, colors };
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.05;

      // Parlaklık animasyonu
      const material = pointsRef.current.material as THREE.PointsMaterial;
      material.opacity = 0.4 + Math.sin(state.clock.elapsedTime * 2) * 0.3;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.25}
        vertexColors
        transparent
        opacity={0.5}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// Ana component
export default function BrainScene() {
  return (
    <div className="w-full h-screen bg-[#020202]">
      <Canvas
        camera={{ position: [0, 0, 12], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]} // Retina desteği
      >
        <color attach="background" args={["#020202"]} />

        {/* Hafif sis efekti */}
        <fog attach="fog" args={["#020202", 15, 30]} />

        {/* Beyin yapısı */}
        <group>
          <NeuralConnections />
          <BrainParticles />
          <ActiveRegions />
        </group>

        {/* Kontroller */}
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          minDistance={5}
          maxDistance={25}
          autoRotate
          autoRotateSpeed={0.2}
        />
      </Canvas>
    </div>
  );
}
