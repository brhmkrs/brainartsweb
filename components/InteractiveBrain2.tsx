"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Center } from "@react-three/drei";
import * as THREE from "three";

const BRAIN_MODEL = "/brain_hologram.glb";
const MODEL_SCALE = 3;

// Bölgeler - örnek-loblar-görsel2.png referansına göre
const BRAIN_REGIONS = {
  frontal: {
    name: "Frontal Lob",
    description: "Karar verme, planlama, problem çözme",
    color: "#ff4444", // Kırmızı
  },
  parietal: {
    name: "Parietal Lob",
    description: "Mekansal algı, dokunma, koordinasyon",
    color: "#ff66cc", // Pembe
  },
  temporal: {
    name: "Temporal Lob",
    description: "Hafıza, dil anlama, duygu işleme",
    color: "#44ff66", // Yeşil
  },
  occipital: {
    name: "Oksipital Lob",
    description: "Görsel işleme, renk ve hareket algısı",
    color: "#ffaa00", // Turuncu/Sarı
  },
  cerebellum: {
    name: "Serebellum",
    description: "Denge, motor kontrol, hareket öğrenme",
    color: "#cc44ff", // Mor
  },
};

type RegionKey = keyof typeof BRAIN_REGIONS;

// Vertex pozisyonuna göre bölge belirle
// 3D koordinat sistemi - tüm eksenleri kullan
function getRegionForVertex(x: number, y: number, z: number, bounds: {minX: number, maxX: number, minY: number, maxY: number, minZ: number, maxZ: number}): RegionKey | null {
  // Normalize coordinates to 0-1 range
  const nx = (x - bounds.minX) / (bounds.maxX - bounds.minX); // 0=minX, 1=maxX
  const ny = (y - bounds.minY) / (bounds.maxY - bounds.minY); // 0=minY, 1=maxY
  const nz = (z - bounds.minZ) / (bounds.maxZ - bounds.minZ); // 0=minZ, 1=maxZ

  // Model koordinat sistemi (tahmini):
  // X: sol(-) / sağ(+) veya ön/arka
  // Y: alt(-) / üst(+)
  // Z: ön(-) / arka(+) veya derinlik

  // Görsel referansa göre (örnek-loblar-görsel2.png):
  // Beyin yandan görünüyor (lateral view)
  // Sol = Ön (Frontal), Sağ = Arka (Occipital)
  // Üst = Parietal, Alt = Cerebellum, Orta-yan = Temporal

  // SEREBELLUM: Alt-arka kısım
  if (ny < 0.30 && nx > 0.40) {
    return "cerebellum";
  }

  // FRONTAL: Ön kısım (sol taraf görüntüde) - tüm ön bölge
  if (nx < 0.40) {
    return "frontal";
  }

  // PARIETAL: Üst-orta (tepe)
  if (ny > 0.60) {
    return "parietal";
  }

  // OCCIPITAL: Arka-orta (sağ taraf görüntüde)
  if (nx > 0.65) {
    return "occipital";
  }

  // TEMPORAL: Orta-alt alan (yan kısım)
  if (ny < 0.55 && nx >= 0.40 && nx <= 0.65) {
    return "temporal";
  }

  return null;
}

interface BrainModelProps {
  selectedRegion: RegionKey | null;
  showAllRegions: boolean;
}

function BrainModel({ selectedRegion, showAllRegions }: BrainModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(BRAIN_MODEL);
  const [clonedScene, setClonedScene] = useState<THREE.Group | null>(null);
  const materialsRef = useRef<Map<THREE.Mesh, THREE.MeshStandardMaterial>>(new Map());

  // Model'i klonla ve vertex colors ekle
  useEffect(() => {
    const cloned = scene.clone(true);

    // Önce koordinat aralığını bul
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        const posAttr = child.geometry.attributes.position;
        if (posAttr) {
          for (let i = 0; i < posAttr.count; i++) {
            const x = posAttr.getX(i);
            const y = posAttr.getY(i);
            const z = posAttr.getZ(i);
            minX = Math.min(minX, x); maxX = Math.max(maxX, x);
            minY = Math.min(minY, y); maxY = Math.max(maxY, y);
            minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
          }
        }
      }
    });

    const bounds = { minX, maxX, minY, maxY, minZ, maxZ };
    console.log("🧠 Model Koordinat Aralıkları:", bounds);

    // Mesh isimlerini logla - belki model zaten loblara ayrılmış
    console.log("🧩 Model Mesh Yapısı:");
    cloned.traverse((child) => {
      console.log(`  - ${child.type}: "${child.name}"`);
    });

    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        // Her mesh için vertex colors oluştur
        const geometry = child.geometry;
        const posAttr = geometry.attributes.position;

        if (posAttr) {
          const colors = new Float32Array(posAttr.count * 3);
          const regions = new Array(posAttr.count);

          // Her vertex için bölge belirle ve beyaz renk ata
          for (let i = 0; i < posAttr.count; i++) {
            const x = posAttr.getX(i);
            const y = posAttr.getY(i);
            const z = posAttr.getZ(i);

            regions[i] = getRegionForVertex(x, y, z, bounds);

            // Başlangıçta beyaz
            colors[i * 3] = 0.9;
            colors[i * 3 + 1] = 0.9;
            colors[i * 3 + 2] = 0.95;
          }

          geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
          (geometry as any)._regions = regions;

          // Yeni materyal oluştur
          const material = new THREE.MeshStandardMaterial({
            vertexColors: true,
            metalness: 0.3,
            roughness: 0.4,
            transparent: true,
            opacity: 0.95,
            side: THREE.DoubleSide,
            emissive: new THREE.Color(0x111122),
            emissiveIntensity: 0.2,
          });

          child.material = material;
          materialsRef.current.set(child, material);
        }
      }
    });

    setClonedScene(cloned);
  }, [scene]);

  // Bölge seçimine göre renkleri güncelle
  useEffect(() => {
    if (!clonedScene) return;

    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        const geometry = child.geometry;
        const colorAttr = geometry.attributes.color;
        const regions = (geometry as any)._regions;

        if (colorAttr && regions) {
          const colors = colorAttr.array as Float32Array;

          for (let i = 0; i < regions.length; i++) {
            const region = regions[i];
            const i3 = i * 3;

            if (selectedRegion && region === selectedRegion) {
              // Seçili bölge - parlak renk
              const regionColor = new THREE.Color(BRAIN_REGIONS[selectedRegion].color);
              colors[i3] = regionColor.r;
              colors[i3 + 1] = regionColor.g;
              colors[i3 + 2] = regionColor.b;
            } else if (showAllRegions && region) {
              // Harita modu - tüm bölgeler renkli
              const regionColor = new THREE.Color(BRAIN_REGIONS[region as RegionKey].color);
              colors[i3] = regionColor.r * 0.8;
              colors[i3 + 1] = regionColor.g * 0.8;
              colors[i3 + 2] = regionColor.b * 0.8;
            } else if (selectedRegion) {
              // Seçili bölge varken diğerleri soluk
              colors[i3] = 0.2;
              colors[i3 + 1] = 0.2;
              colors[i3 + 2] = 0.25;
            } else {
              // Normal mod - beyaz/açık gri
              colors[i3] = 0.85;
              colors[i3 + 1] = 0.85;
              colors[i3 + 2] = 0.9;
            }
          }

          colorAttr.needsUpdate = true;
        }
      }
    });
  }, [clonedScene, selectedRegion, showAllRegions]);

  // Yavaş rotasyon
  useFrame((state) => {
    if (groupRef.current && !selectedRegion) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }

    // Emissive pulse efekti
    if (clonedScene && selectedRegion) {
      const pulse = 0.15 + 0.1 * Math.sin(state.clock.elapsedTime * 3);
      materialsRef.current.forEach((material) => {
        material.emissiveIntensity = pulse;
      });
    }
  });

  if (!clonedScene) return null;

  return (
    <group ref={groupRef}>
      <Center>
        <primitive object={clonedScene} scale={MODEL_SCALE} />
      </Center>
    </group>
  );
}

// Bölge seçici
function RegionSelector({
  selectedRegion,
  onSelect,
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
            }}
          >
            <span style={{ color: isSelected ? region.color : "#ffffff" }}>
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
          className="bg-black/80 backdrop-blur-md border rounded-xl px-8 py-5 text-center min-w-[300px]"
          style={{ borderColor: info.color + "60" }}
        >
          <div
            className="w-3 h-3 rounded-full mx-auto mb-3 animate-pulse"
            style={{ backgroundColor: info.color }}
          />
          <h3 className="text-2xl font-bold mb-2" style={{ color: info.color }}>
            {info.name}
          </h3>
          <p className="text-white/70 text-sm">{info.description}</p>
        </div>
      )}
    </div>
  );
}

// Ana component
export default function InteractiveBrain2() {
  const [selectedRegion, setSelectedRegion] = useState<RegionKey | null>(null);
  const [showAllRegions, setShowAllRegions] = useState(false);

  return (
    <div className="w-full h-screen bg-[#030508] relative overflow-hidden">
      {/* Başlık */}
      <div className="absolute top-6 left-6 z-10">
        <h1 className="text-white text-3xl font-light tracking-wide">
          Brain<span className="font-bold text-blue-400">Arts</span>
        </h1>
        <p className="text-white/40 text-sm mt-1">Hologram Model</p>
      </div>

      {/* Butonlar */}
      <div className="absolute top-6 right-6 z-10 flex gap-2">
        <button
          onClick={() => {
            setShowAllRegions(!showAllRegions);
            setSelectedRegion(null);
          }}
          className={`px-4 py-2 rounded-lg text-sm border backdrop-blur-sm transition-all ${
            showAllRegions
              ? "bg-white/20 border-white/40 text-white"
              : "bg-white/5 border-white/20 text-white/70 hover:bg-white/10"
          }`}
        >
          Bolge Haritasi
        </button>
      </div>

      {/* Bölge seçici */}
      <RegionSelector selectedRegion={selectedRegion} onSelect={(r) => {
        setSelectedRegion(r);
        setShowAllRegions(false);
      }} />

      {/* Bilgi paneli */}
      <InfoPanel region={selectedRegion} />

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={["#030508"]} />

        {/* Aydınlatma */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <directionalLight position={[-5, -5, -5]} intensity={0.4} />
        <pointLight position={[0, 2, 3]} intensity={0.5} color="#4488ff" />

        <BrainModel selectedRegion={selectedRegion} showAllRegions={showAllRegions} />

        <OrbitControls
          enableZoom={true}
          enablePan={false}
          minDistance={2}
          maxDistance={12}
          autoRotate={false}
        />
      </Canvas>
    </div>
  );
}

useGLTF.preload(BRAIN_MODEL);
