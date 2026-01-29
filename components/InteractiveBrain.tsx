"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Center } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";

const BRAIN_MODEL = "/human_brain.glb";
const MODEL_SCALE = 0.02;

const BRAIN_REGIONS = {
  cerebellum: {
    name: "Serebellum",
    description: "Denge, motor kontrol, hareket öğrenme",
    color: "#ee55ff",
    center: { x: 0, y: 0, z: -50 },
  },
  parietal: {
    name: "Parietal Lob",
    description: "Mekansal algı, dokunma, koordinasyon",
    color: "#4499ff",
    center: { x: 0, y: 0, z: 100 },
  },
  temporal: {
    name: "Temporal Lob",
    description: "Hafıza, dil anlama, duygu işleme",
    color: "#ffee00",
    center: { x: 90, y: 0, z: 40 },
  },
  frontal: {
    name: "Frontal Lob",
    description: "Karar verme, planlama, problem çözme, kişilik",
    color: "#ff4444",
    center: { x: 0, y: -80, z: 40 },
  },
  occipital: {
    name: "Oksipital Lob",
    description: "Görsel işleme, renk ve hareket algısı",
    color: "#44ee66",
    center: { x: 0, y: 60, z: 40 },
  },
};

type RegionKey = keyof typeof BRAIN_REGIONS;

interface BrainModelProps {
  selectedRegion: RegionKey | null;
  showAllRegions?: boolean;
}

// VANILLA THREE.JS YAKLAŞIMI
function BrainModel({ selectedRegion, showAllRegions = false }: BrainModelProps) {
  const { scene: threeScene } = useThree();
  const { scene: gltfScene } = useGLTF(BRAIN_MODEL);

  const pointsRef = useRef<THREE.Points | null>(null);
  const dataRef = useRef<{
    colors: Float32Array;
    regions: string[];
  } | null>(null);
  const isInitialized = useRef(false);

  // Props ref
  const selectedRegionRef = useRef(selectedRegion);
  const showAllRegionsRef = useRef(showAllRegions);
  selectedRegionRef.current = selectedRegion;
  showAllRegionsRef.current = showAllRegions;

  // Scene'e points ekle - SADECE BİR KEZ
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    console.log("🚀 Points oluşturuluyor...");

    const positions: number[] = [];
    const colors: number[] = [];
    const regions: string[] = [];

    const parentToRegion: Record<string, string> = {
      "cereb1": "cerebellum",
      "frontal1": "frontal",
      "occipit1": "occipital",
      "pariet1": "parietal",
      "temp1": "temporal",
      "brain1": "default",
    };

    gltfScene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        const posAttr = child.geometry.attributes.position;
        if (posAttr) {
          const parentName = child.parent?.name || "";
          const region = parentToRegion[parentName] || "default";

          for (let i = 0; i < posAttr.count; i++) {
            positions.push(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
            regions.push(region);
            colors.push(0.5, 0.5, 0.55); // Gri başlangıç
          }
        }
      }
    });

    console.log("📊 Toplam partikül:", positions.length / 3);

    // Geometry oluştur
    const geometry = new THREE.BufferGeometry();
    const posArray = new Float32Array(positions);
    const colorArray = new Float32Array(colors);

    geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

    // Material - PARTİKÜL GÖRÜNÜMÜ (Normal blending - renkler görünsün)
    const material = new THREE.PointsMaterial({
      size: 0.03,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      sizeAttenuation: true,
      // AdditiveBlending KULLANMA - koyu renkler görünmez olur!
    });

    // Points objesi
    const points = new THREE.Points(geometry, material);
    points.rotation.x = -Math.PI / 2;
    points.scale.set(MODEL_SCALE, MODEL_SCALE, MODEL_SCALE);

    // Scene'e ekle
    threeScene.add(points);
    pointsRef.current = points;
    dataRef.current = { colors: colorArray, regions };

    console.log("✅ Points scene'e eklendi");

    // Cleanup
    return () => {
      threeScene.remove(points);
      geometry.dispose();
      material.dispose();
    };
  }, [gltfScene, threeScene]);

  // Her frame'de renkleri güncelle + DALGA EFEKTİ
  useFrame((state) => {
    const points = pointsRef.current;
    const data = dataRef.current;
    if (!points || !data) return;

    const { colors, regions } = data;
    const currentRegion = selectedRegionRef.current;
    const time = state.clock.elapsedTime;

    if (currentRegion) {
      const regionColor = new THREE.Color(BRAIN_REGIONS[currentRegion].color);
      const regionCenter = BRAIN_REGIONS[currentRegion].center;

      // Dalga parametreleri
      const waveSpeed = 60;
      const waveWidth = 30;

      for (let i = 0; i < regions.length; i++) {
        const i3 = i * 3;

        if (regions[i] === currentRegion) {
          // Partikül pozisyonunu al (positions array'den)
          const posAttr = points.geometry.attributes.position;
          const px = posAttr.getX(i);
          const py = posAttr.getY(i);
          const pz = posAttr.getZ(i);

          // Merkeze uzaklık
          const dist = Math.sqrt(
            Math.pow(px - regionCenter.x, 2) +
            Math.pow(py - regionCenter.y, 2) +
            Math.pow(pz - regionCenter.z, 2)
          );

          // Dalga efekti - merkezden dışarı yayılan
          const wavePos = (time * waveSpeed) % 150;
          const distToWave = Math.abs(dist - wavePos);
          const waveIntensity = distToWave < waveWidth ? (1 - distToWave / waveWidth) : 0;

          // Parlaklık: base + dalga boost
          const pulse = 0.85 + 0.15 * Math.sin(time * 3 + i * 0.01); // Hafif titreşim
          const intensity = pulse + waveIntensity * 0.5;

          colors[i3] = Math.min(regionColor.r * intensity, 1);
          colors[i3 + 1] = Math.min(regionColor.g * intensity, 1);
          colors[i3 + 2] = Math.min(regionColor.b * intensity, 1);
        } else {
          // Diğer bölgeler - koyu ve sabit
          colors[i3] = 0.12;
          colors[i3 + 1] = 0.12;
          colors[i3 + 2] = 0.15;
        }
      }
    } else {
      // Normal mod - hafif nefes efekti
      const breathe = 0.45 + 0.1 * Math.sin(time * 1.5);
      for (let i = 0; i < colors.length; i += 3) {
        colors[i] = breathe;
        colors[i + 1] = breathe;
        colors[i + 2] = breathe + 0.05;
      }
    }

    // GPU'ya gönder
    points.geometry.attributes.color.needsUpdate = true;
  });

  return null; // JSX yok - doğrudan scene'e eklendi
}

// Bölge seçim butonları
function RegionSelector({
  selectedRegion,
  onSelect
}: {
  selectedRegion: RegionKey | null;
  onSelect: (region: RegionKey | null) => void;
}) {
  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-2">
      {(Object.keys(BRAIN_REGIONS) as RegionKey[]).map((key) => {
        const region = BRAIN_REGIONS[key];
        const isSelected = selectedRegion === key;

        return (
          <button
            key={key}
            onClick={() => onSelect(isSelected ? null : key)}
            className={`px-4 py-2.5 rounded-lg text-left text-sm transition-all duration-300 border backdrop-blur-sm ${
              isSelected
                ? "bg-white/20 border-white/40 scale-105"
                : "bg-black/60 border-white/10 hover:bg-white/10"
            }`}
            style={{
              borderLeftColor: region.color,
              borderLeftWidth: "4px",
              boxShadow: isSelected ? `0 0 20px ${region.color}40` : "none",
            }}
          >
            <span
              className="font-medium"
              style={{ color: isSelected ? region.color : "#ffffff" }}
            >
              {region.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// Bilgi paneli
function InfoPanel({ region }: { region: RegionKey | null }) {
  const info = region ? BRAIN_REGIONS[region] : null;

  return (
    <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-10 transition-all duration-500 ${
      info ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
    }`}>
      {info && (
        <div
          className="bg-black/80 backdrop-blur-md border rounded-xl px-8 py-5 text-center min-w-[350px]"
          style={{
            borderColor: info.color + "60",
            boxShadow: `0 0 40px ${info.color}20`
          }}
        >
          <div
            className="w-3 h-3 rounded-full mx-auto mb-3 animate-pulse"
            style={{ backgroundColor: info.color }}
          />
          <h3
            className="text-2xl font-bold mb-2"
            style={{ color: info.color }}
          >
            {info.name}
          </h3>
          <p className="text-white/70 text-sm">{info.description}</p>
        </div>
      )}
    </div>
  );
}

// Props interface
interface InteractiveBrainProps {
  selectedRegion?: RegionKey | null;
  showAllRegions?: boolean;
  showControls?: boolean;
}

// Ana component
export default function InteractiveBrain({
  selectedRegion: externalRegion,
  showAllRegions: externalShowAll,
  showControls = true,
}: InteractiveBrainProps = {}) {
  // Internal state (showControls true ise kullanılır)
  const [internalRegion, setInternalRegion] = useState<RegionKey | null>(null);
  const [internalShowAll, setInternalShowAll] = useState(false);

  // External props varsa onları kullan, yoksa internal state
  const selectedRegion = externalRegion !== undefined ? externalRegion : internalRegion;
  const showAllRegions = externalShowAll !== undefined ? externalShowAll : internalShowAll;

  return (
    <div className="w-full h-screen bg-[#030508] relative overflow-hidden">
      {/* Başlık - sadece controls açıksa */}
      {showControls && (
        <div className="absolute top-6 left-6 z-10">
          <h1 className="text-white text-3xl font-light tracking-wide">
            Brain<span className="font-bold text-blue-400">Arts</span>
          </h1>
          <p className="text-white/30 text-sm mt-1">
            Nöral aktiviteyi keşfedin
          </p>
        </div>
      )}

      {/* Bölge seçici - sadece controls açıksa */}
      {showControls && (
        <RegionSelector selectedRegion={selectedRegion} onSelect={setInternalRegion} />
      )}

      {/* Bilgi paneli - sadece controls açıksa */}
      {showControls && (
        <InfoPanel region={selectedRegion} />
      )}

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0.5, 14], fov: 35 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#030508"]} />
        <ambientLight intensity={0.5} />
        <BrainModel selectedRegion={selectedRegion} showAllRegions={showAllRegions} />
        <OrbitControls
          enableZoom={showControls}
          enablePan={false}
          minDistance={2}
          maxDistance={15}
          autoRotate={true}
          autoRotateSpeed={0.3}
        />
      </Canvas>
    </div>
  );
}

useGLTF.preload(BRAIN_MODEL);
