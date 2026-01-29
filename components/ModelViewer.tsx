"use client";

import { useRef, useState, useEffect, useMemo, Suspense } from "react";
import { Canvas, useFrame, useThree, extend } from "@react-three/fiber";
import { OrbitControls, useGLTF, Center, Environment, Preload } from "@react-three/drei";
import * as THREE from "three";

type ModelStyle =
  | "original"
  | "wireframe"
  | "edges"
  | "particles"
  | "hologram-bw"
  | "glass"
  | "dark-mercury"
  | "fresnel"
  | "hybrid";

interface BrainModelProps {
  modelPath: string;
  style: ModelStyle;
  selectedRegion: string | null;
  onRegionClick: (region: string | null) => void;
}

// Parent node -> Region mapping for human_brain.glb
const PARENT_TO_REGION: Record<string, string> = {
  "cereb1": "cerebellum",
  "frontal1": "frontal",
  "occipit1": "occipital",
  "pariet1": "parietal",
  "temp1": "temporal",
  "brain1": "brainstem",
};

// Region bilgileri
const REGION_INFO: Record<string, { name: string; color: string }> = {
  "cerebellum": { name: "Cerebellum", color: "#ffaa44" },
  "frontal": { name: "Frontal Lobe", color: "#ff6644" },
  "occipital": { name: "Occipital Lobe", color: "#44aaff" },
  "parietal": { name: "Parietal Lobe", color: "#aa44ff" },
  "temporal": { name: "Temporal Lobe", color: "#44ffaa" },
  "brainstem": { name: "Brain Stem", color: "#ffff44" },
};

// Model ölçekleri (her model için ayarlanmış)
const MODEL_SCALES: Record<string, number> = {
  "/human_brain.glb": 0.02,
  "/brain_hologram.glb": 0.5,
  "/neural_networks_of_the_brain.glb": 0.15,
};

// Fresnel shader material
const fresnelVertexShader = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fresnelFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  uniform vec3 uColor;
  uniform float uFresnelPower;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = pow(1.0 - abs(dot(viewDir, normal)), uFresnelPower);

    gl_FragColor = vec4(uColor, fresnel * 0.9);
  }
`;

// Mesh'in hangi bölgeye ait olduğunu bul
function getMeshRegion(mesh: THREE.Object3D): string | null {
  let current = mesh.parent;
  while (current) {
    if (current.name && PARENT_TO_REGION[current.name]) {
      return PARENT_TO_REGION[current.name];
    }
    current = current.parent;
  }
  return null;
}

// GLB Model yükleyici ve stil dönüştürücü
function BrainModel({ modelPath, style, selectedRegion, onRegionClick }: BrainModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(modelPath);
  const [particlePositions, setParticlePositions] = useState<Float32Array | null>(null);
  const [edgeGeometries, setEdgeGeometries] = useState<THREE.BufferGeometry[]>([]);
  const meshRegionMap = useRef<Map<THREE.Mesh, string>>(new Map());

  const scale = MODEL_SCALES[modelPath] || 1;
  const isMercuryMode = style === "glass" || style === "dark-mercury";

  // Fresnel material
  const fresnelMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: fresnelVertexShader,
      fragmentShader: fresnelFragmentShader,
      uniforms: {
        uColor: { value: new THREE.Color("#88ccff") },
        uFresnelPower: { value: 2.5 },
      },
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  // Model yüklendiğinde mesh'lerden vertex pozisyonlarını çıkar
  useEffect(() => {
    if (style === "particles" || style === "hologram-bw" || style === "hybrid") {
      const positions: number[] = [];

      scene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.geometry) {
          const posAttr = child.geometry.attributes.position;
          if (posAttr) {
            // Her 3. vertex'i al (performans için)
            for (let i = 0; i < posAttr.count; i += 3) {
              positions.push(
                posAttr.getX(i),
                posAttr.getY(i),
                posAttr.getZ(i)
              );
            }
          }
        }
      });

      if (positions.length > 0) {
        setParticlePositions(new Float32Array(positions));
      }
    }
  }, [scene, style]);

  // Edges geometry oluştur
  useEffect(() => {
    if (style === "edges" || style === "hybrid") {
      const geometries: THREE.BufferGeometry[] = [];

      scene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.geometry) {
          // EdgesGeometry ile sadece keskin kenarları al
          const edgeGeo = new THREE.EdgesGeometry(child.geometry, 30);
          // World matrix uygula
          const cloned = edgeGeo.clone();
          child.updateWorldMatrix(true, false);
          cloned.applyMatrix4(child.matrixWorld);
          geometries.push(cloned);
        }
      });

      setEdgeGeometries(geometries);
    }

    return () => {
      edgeGeometries.forEach(geo => geo.dispose());
    };
  }, [scene, style]);

  // Materyal stilini değiştir
  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.visible = true;

        if (style === "wireframe") {
          child.material = new THREE.MeshBasicMaterial({
            color: "#ffffff",
            wireframe: true,
            transparent: true,
            opacity: 0.6,
          });
        } else if (style === "edges") {
          // Edges modunda mesh'leri gizle
          child.visible = false;
        } else if (style === "hologram-bw") {
          child.material = new THREE.MeshPhongMaterial({
            color: "#888888",
            emissive: "#222222",
            transparent: true,
            opacity: 0.15,
            side: THREE.DoubleSide,
          });
        } else if (style === "glass" || style === "dark-mercury") {
          // Mercury modları - bölge seçimine göre materyal
          const meshRegion = getMeshRegion(child);
          if (meshRegion) {
            meshRegionMap.current.set(child, meshRegion);
          }

          const isSelected = selectedRegion && meshRegion === selectedRegion;
          const isOtherSelected = selectedRegion && meshRegion !== selectedRegion;
          const isDarkMode = style === "dark-mercury";

          if (isSelected) {
            // SEÇİLİ - ekstra parlak mercury + hafif beyaz glow
            child.material = new THREE.MeshStandardMaterial({
              color: "#f0f0f0",
              emissive: "#aabbcc",
              emissiveIntensity: 0.2,
              metalness: 1.0,
              roughness: 0.0,
              envMapIntensity: isDarkMode ? 1.5 : 2.5,
            });
          } else if (isOtherSelected) {
            // Seçili DEĞİL - çok karanlık/neredeyse siyah
            child.material = new THREE.MeshStandardMaterial({
              color: "#080808",
              metalness: 1.0,
              roughness: 0.4,
              envMapIntensity: 0.05,
            });
          } else {
            // Hiçbir şey seçili değil - normal parlak mercury
            child.material = new THREE.MeshStandardMaterial({
              color: isDarkMode ? "#a0a0a0" : "#b8b8b8",
              metalness: 1.0,
              roughness: isDarkMode ? 0.05 : 0.0,
              envMapIntensity: isDarkMode ? 0.8 : 1.5,
            });
          }
        } else if (style === "fresnel") {
          child.material = fresnelMaterial.clone();
        } else if (style === "hybrid") {
          // Hybrid: yarı saydam mesh
          child.material = new THREE.MeshPhongMaterial({
            color: "#334455",
            transparent: true,
            opacity: 0.1,
            side: THREE.DoubleSide,
          });
        } else if (style === "particles") {
          child.visible = false;
        } else if (style === "original") {
          // Orijinal materyal - sadece parlaklık ekle
          if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material.metalness = 0.3;
            child.material.roughness = 0.7;
          }
        }
      }
    });
  }, [scene, style, fresnelMaterial, selectedRegion]);

  // Rotasyon animasyonu
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  // Edges görünümü
  if (style === "edges") {
    return (
      <group ref={groupRef} scale={scale}>
        <Center>
          {edgeGeometries.map((geo, i) => (
            <lineSegments key={i} geometry={geo}>
              <lineBasicMaterial
                color="#88ccff"
                transparent
                opacity={0.8}
                linewidth={1}
              />
            </lineSegments>
          ))}
        </Center>
      </group>
    );
  }

  // Hybrid görünümü (particles + edges + yarı saydam mesh)
  if (style === "hybrid" && particlePositions) {
    return (
      <group ref={groupRef} scale={scale}>
        <Center>
          {/* Yarı saydam mesh */}
          <primitive object={scene.clone()} scale={1} />

          {/* Edge çizgiler */}
          {edgeGeometries.map((geo, i) => (
            <lineSegments key={`edge-${i}`} geometry={geo}>
              <lineBasicMaterial
                color="#4488ff"
                transparent
                opacity={0.4}
                linewidth={1}
              />
            </lineSegments>
          ))}

          {/* Partiküller */}
          <points>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[particlePositions, 3]}
              />
            </bufferGeometry>
            <pointsMaterial
              size={0.012}
              color="#88ddff"
              transparent
              opacity={0.7}
              sizeAttenuation
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </points>
        </Center>
      </group>
    );
  }

  // Partikül görünümü
  if ((style === "particles" || style === "hologram-bw") && particlePositions) {
    return (
      <group ref={groupRef} scale={scale}>
        <Center>
          {/* Yarı saydam mesh (hologram efekti için) */}
          {style === "hologram-bw" && (
            <primitive object={scene.clone()} scale={1} />
          )}

          {/* Partiküller */}
          <points>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[particlePositions, 3]}
              />
            </bufferGeometry>
            <pointsMaterial
              size={style === "hologram-bw" ? 0.015 : 0.02}
              color={style === "hologram-bw" ? "#ffffff" : "#88ccff"}
              transparent
              opacity={0.9}
              sizeAttenuation
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </points>
        </Center>
      </group>
    );
  }

  // Raycaster ile tıklama - useThree kullan
  const { raycaster, camera, gl } = useThree();
  const [pointer] = useState(() => new THREE.Vector2());

  // Tıklama işleyicisi
  useEffect(() => {
    if (!isMercuryMode) return;

    const handleClick = (event: MouseEvent) => {
      // Normalize mouse position
      const rect = gl.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Raycast
      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        const mesh = intersects[0].object as THREE.Mesh;
        const region = getMeshRegion(mesh);

        if (region) {
          if (selectedRegion === region) {
            onRegionClick(null);
          } else {
            onRegionClick(region);
          }
        }
      } else {
        // Boşluğa tıklandı
        if (selectedRegion) {
          onRegionClick(null);
        }
      }
    };

    gl.domElement.addEventListener("click", handleClick);
    return () => {
      gl.domElement.removeEventListener("click", handleClick);
    };
  }, [isMercuryMode, selectedRegion, onRegionClick, raycaster, camera, gl, scene, pointer]);

  return (
    <group ref={groupRef} scale={scale}>
      <Center>
        <primitive object={scene} scale={1} />
      </Center>
    </group>
  );
}

// Model seçici UI
interface ModelOption {
  name: string;
  path: string;
  description: string;
}

const MODELS: ModelOption[] = [
  { name: "Human Brain", path: "/human_brain.glb", description: "Klasik anatomi" },
  { name: "Brain Hologram", path: "/brain_hologram.glb", description: "Hologram efektli" },
  { name: "Neural Networks", path: "/neural_networks_of_the_brain.glb", description: "Low-poly, bölgeli" },
];

const STYLES: { name: string; value: ModelStyle; description: string }[] = [
  { name: "Orijinal", value: "original", description: "Model olduğu gibi" },
  { name: "Wireframe", value: "wireframe", description: "Tel kafes (tüm çizgiler)" },
  { name: "Edges", value: "edges", description: "Sadece kenarlar" },
  { name: "Particles", value: "particles", description: "Sadece noktalar" },
  { name: "Mercury", value: "glass", description: "Parlak sıvı cıva" },
  { name: "Dark Mercury", value: "dark-mercury", description: "Karanlıkta dönen cıva" },
  { name: "Fresnel", value: "fresnel", description: "Kenar parlaması" },
  { name: "Hologram B/W", value: "hologram-bw", description: "Siyah-beyaz hologram" },
  { name: "Hybrid", value: "hybrid", description: "Particles + Edges" },
];

export default function ModelViewer() {
  const [selectedModel, setSelectedModel] = useState(0);
  const [selectedStyle, setSelectedStyle] = useState<ModelStyle>("original");
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const isMercuryMode = selectedStyle === "glass" || selectedStyle === "dark-mercury";

  // Stil değişince seçili bölgeyi sıfırla
  useEffect(() => {
    setSelectedRegion(null);
  }, [selectedStyle, selectedModel]);

  return (
    <div className="w-full h-screen bg-[#020202] flex flex-col">
      {/* Kontrol paneli */}
      <div className="absolute top-4 left-4 z-10 bg-black/70 p-4 rounded-lg border border-white/10 max-h-[90vh] overflow-y-auto">
        <h2 className="text-white font-semibold mb-4 text-lg">Model Viewer</h2>

        <div className="mb-4">
          <h3 className="text-white/80 text-sm mb-2">Model:</h3>
          <div className="flex flex-col gap-1">
            {MODELS.map((model, i) => (
              <button
                key={model.path}
                onClick={() => setSelectedModel(i)}
                className={`px-3 py-1.5 text-left text-sm rounded transition-colors ${
                  selectedModel === i
                    ? "bg-white text-black"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {model.name}
                <span className="text-xs opacity-60 ml-2">{model.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-white/80 text-sm mb-2">Render Modu:</h3>
          <div className="flex flex-col gap-1">
            {STYLES.map((style) => (
              <button
                key={style.value}
                onClick={() => setSelectedStyle(style.value)}
                className={`px-3 py-1.5 text-left text-sm rounded transition-colors ${
                  selectedStyle === style.value
                    ? "bg-white text-black"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {style.name}
                <span className="text-xs opacity-60 ml-2">{style.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Bilgi */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-white/40 text-xs">
            Mouse: Döndür / Scroll: Zoom
          </p>
        </div>
      </div>

      {/* Aktif mod göstergesi */}
      <div className="absolute top-4 right-4 z-10 bg-black/70 px-4 py-2 rounded-lg border border-white/10">
        <p className="text-white/60 text-sm">
          <span className="text-white">{MODELS[selectedModel].name}</span>
          {" · "}
          <span className="text-cyan-400">{STYLES.find(s => s.value === selectedStyle)?.name}</span>
        </p>
      </div>

      {/* Seçili bölge göstergesi (Mercury modlarında) */}
      {isMercuryMode && selectedRegion && (
        <div className="absolute top-16 right-4 z-10 px-4 py-3 rounded-lg border border-white/30 bg-white/10 backdrop-blur-sm transition-all duration-300">
          <p className="text-white font-medium">
            {REGION_INFO[selectedRegion]?.name}
          </p>
          <p className="text-white/50 text-xs mt-1">
            Başka yere tıkla: Seçimi kaldır
          </p>
        </div>
      )}

      {/* Mercury modunda ipucu */}
      {isMercuryMode && !selectedRegion && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-black/50 px-4 py-2 rounded-lg">
          <p className="text-white/60 text-sm">
            Bir bölgeye tıkla
          </p>
        </div>
      )}

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0, 8], fov: 45 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
        className="flex-1"
      >
        <color attach="background" args={["#020202"]} />

        <Suspense fallback={null}>
          {/* Aydınlatma */}
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <directionalLight position={[-5, -5, -5]} intensity={0.3} />
          <pointLight position={[0, 0, 3]} intensity={0.5} color="#4488ff" />

          {/* Mercury - Liquid Metal için Environment yansımaları */}
          {selectedStyle === "glass" && (
            <Environment preset="studio" background={false} />
          )}

          {/* Dark Mercury için karanlık environment */}
          {selectedStyle === "dark-mercury" && (
            <>
              <Environment preset="night" background={false} />
              <pointLight position={[5, 5, 5]} intensity={0.5} color="#ffffff" />
            </>
          )}

          {/* Model */}
          <BrainModel
            key={`${MODELS[selectedModel].path}-${selectedStyle}`}
            modelPath={MODELS[selectedModel].path}
            style={selectedStyle}
            selectedRegion={selectedRegion}
            onRegionClick={setSelectedRegion}
          />
        </Suspense>

        {/* Kontroller */}
        <OrbitControls
          enableZoom={true}
          enablePan={true}
          minDistance={1}
          maxDistance={50}
          autoRotate={false}
        />
      </Canvas>
    </div>
  );
}

// Preload models
MODELS.forEach((model) => useGLTF.preload(model.path));
