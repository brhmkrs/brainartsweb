"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { Bebas_Neue, Inter } from "next/font/google";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Fonts
const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas"
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
});

// Config - DENEME B: Neural Networks modeli
const BRAIN_MODEL = "/neural_networks_of_the_brain.glb";
const MODEL_SCALE = 0.001;  // Neural networks modeli çok büyük, çok küçült

// Brain regions - camera ORBITS around brain
// Model rotated -90deg X: front of brain faces camera at default position
// More dramatic camera angles for each region
const BRAIN_REGIONS = {
  temporal: {
    name: "Temporal Lob",
    subtitle: "Hafıza Katmanı",
    description: "Hafıza, dil anlama ve duygu işleme merkezi. Ses ve görsel hafıza burada depolanır.",
    cameraTarget: { x: 0, y: 0, z: 0 },
    cameraOffset: { x: 15, y: 0, z: 12 },
  },
  frontal: {
    name: "Frontal Lob",
    subtitle: "Karar Merkezi",
    description: "Karar verme, planlama ve problem çözme. Kişiliğinizin merkezi.",
    cameraTarget: { x: 0, y: 0, z: 0 },
    cameraOffset: { x: 5, y: 2, z: 18 },
  },
  parietal: {
    name: "Parietal Lob",
    subtitle: "Analiz Motoru",
    description: "Mekansal algı ve koordinasyon. Dokunma duyusu burada işlenir.",
    cameraTarget: { x: 0, y: 0, z: 0 },
    cameraOffset: { x: 3, y: 15, z: 10 },
  },
  occipital: {
    name: "Oksipital Lob",
    subtitle: "Görsel İşlemci",
    description: "Görsel işleme merkezi. Gördüklerinizi anlamlandırır.",
    cameraTarget: { x: 0, y: 0, z: 0 },
    cameraOffset: { x: 0, y: 5, z: -15 },
  },
  cerebellum: {
    name: "Serebellum",
    subtitle: "Koordinatör",
    description: "Denge ve motor kontrol. Hareketlerinizin hassas koordinasyonu.",
    cameraTarget: { x: 0, y: 0, z: 0 },
    cameraOffset: { x: 0, y: 8, z: -12 },
  },
};

type RegionKey = keyof typeof BRAIN_REGIONS;
const REGION_KEYS = Object.keys(BRAIN_REGIONS) as RegionKey[];

// Camera positions - neural network model için daha uzak
const CAMERA_POSITIONS = {
  initial: { x: 0, y: 0, z: 25 },  // Çok uzak
  hero: { x: 0, y: 0, z: 20 },     // Uzak
};

// Camera Controller Component
function CameraController({
  selectedRegion,
  scrollProgress,
  mousePosition
}: {
  selectedRegion: RegionKey | null;
  scrollProgress: number;
  mousePosition: { x: number; y: number };
}) {
  const { camera } = useThree();
  const targetRef = useRef({ x: 0, y: 0, z: 12 });
  const lookAtRef = useRef({ x: 0, y: 0, z: 0 });

  useFrame(() => {
    let targetPos = { ...CAMERA_POSITIONS.initial };
    let lookAt = { x: 0, y: 0, z: 0 };

    if (selectedRegion) {
      // Region selected - zoom in and offset toward region
      const regionData = BRAIN_REGIONS[selectedRegion];
      targetPos = {
        x: regionData.cameraOffset.x,
        y: regionData.cameraOffset.y,
        z: regionData.cameraOffset.z,
      };
      lookAt = {
        x: regionData.cameraTarget.x,
        y: regionData.cameraTarget.y,
        z: regionData.cameraTarget.z,
      };
    } else if (scrollProgress > 0.05) {
      // Scrolling but no region - intermediate zoom
      targetPos = CAMERA_POSITIONS.hero;
    }

    // Add subtle mouse influence
    const mouseInfluence = selectedRegion ? 0.3 : 0.5;
    targetPos.x += mousePosition.x * mouseInfluence;
    targetPos.y -= mousePosition.y * mouseInfluence * 0.5;

    // Smooth interpolation - daha yavaş, sinematik geçişler
    const posSpeed = 0.018;  // Daha yavaş kamera hareketi
    const lookSpeed = 0.022; // Daha yavaş bakış geçişi

    targetRef.current.x += (targetPos.x - targetRef.current.x) * posSpeed;
    targetRef.current.y += (targetPos.y - targetRef.current.y) * posSpeed;
    targetRef.current.z += (targetPos.z - targetRef.current.z) * posSpeed;

    lookAtRef.current.x += (lookAt.x - lookAtRef.current.x) * lookSpeed;
    lookAtRef.current.y += (lookAt.y - lookAtRef.current.y) * lookSpeed;
    lookAtRef.current.z += (lookAt.z - lookAtRef.current.z) * lookSpeed;

    camera.position.set(targetRef.current.x, targetRef.current.y, targetRef.current.z);
    camera.lookAt(lookAtRef.current.x, lookAtRef.current.y, lookAtRef.current.z);
  });

  return null;
}

// 3D Brain Component
// DENEME A: Wireframe-only hologram tarzı
function BrainModel({
  selectedRegion,
  mousePosition
}: {
  selectedRegion: RegionKey | null;
  mousePosition: { x: number; y: number };
}) {
  const { scene: gltfScene } = useGLTF(BRAIN_MODEL);

  const wireframesRef = useRef<Record<string, THREE.LineSegments[]>>({});
  const isInitialized = useRef(false);
  const groupRef = useRef<THREE.Group>(null);

  const selectedRegionRef = useRef(selectedRegion);
  selectedRegionRef.current = selectedRegion;

  // Brain rotation based on mouse - only Y axis (horizontal)
  useFrame(() => {
    if (groupRef.current) {
      const intensity = selectedRegion ? 0.15 : 0.4;
      const targetY = mousePosition.x * intensity;
      groupRef.current.rotation.y += (targetY - groupRef.current.rotation.y) * 0.05;
      groupRef.current.rotation.x = 0;
    }
  });

  // WIREFRAME-ONLY: Sadece çizgiler, partikül yok
  useEffect(() => {
    if (isInitialized.current || !groupRef.current) return;
    isInitialized.current = true;

    // Neural Networks modeli için mapping (left/right/center → beyin bölgeleri)
    const parentToRegion: Record<string, string> = {
      "left_08 - Default_0 Front": "temporal",
      "right_08 - Default_0 Front": "frontal",
      "centr_08 - Default_0": "parietal",
      "left_08 - Default_0.001": "occipital",
      "right_08 - Default_0.001": "cerebellum",
      "right_08 - Default_0 Back": "temporal",
      "left_08 - Default_0 Back": "frontal",
    };

    const wireframes: Record<string, THREE.LineSegments[]> = {};

    gltfScene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        const parentName = child.parent?.name || "";
        const region = parentToRegion[parentName] || "default";

        // Serebellum için EdgesGeometry (daha seyrek), diğerleri için WireframeGeometry
        const lineGeometry = region === "cerebellum"
          ? new THREE.EdgesGeometry(child.geometry, 35) // Sadece keskin kenarlar (threshold artırıldı)
          : new THREE.WireframeGeometry(child.geometry); // Tüm üçgenler

        const wireframeMaterial = new THREE.LineBasicMaterial({
          color: region === "default" ? 0x334455 : 0x556677,
          transparent: true,
          opacity: region === "default" ? 0.15 : (region === "cerebellum" ? 0.35 : 0.25),
        });

        const wireframe = new THREE.LineSegments(lineGeometry, wireframeMaterial);
        wireframe.rotation.x = -Math.PI / 2;
        wireframe.scale.set(MODEL_SCALE, MODEL_SCALE, MODEL_SCALE);

        groupRef.current!.add(wireframe);

        // Her bölge için TÜM wireframe'leri sakla
        if (!wireframes[region]) {
          wireframes[region] = [];
        }
        wireframes[region].push(wireframe);
      }
    });

    wireframesRef.current = wireframes;
    // Log mesh counts per region
    Object.entries(wireframes).forEach(([region, wfs]) => {
      console.log(`🔷 ${region}: ${wfs.length} mesh(es)`);
    });

    return () => {
      Object.values(wireframesRef.current).forEach(wfArray => {
        wfArray.forEach(wf => {
          if (groupRef.current) groupRef.current.remove(wf);
          wf.geometry.dispose();
          (wf.material as THREE.Material).dispose();
        });
      });
    };
  }, [gltfScene]);

  // WIREFRAME animasyonu - tüm mesh'ler için
  useFrame((state) => {
    const current = selectedRegionRef.current;
    const time = state.clock.elapsedTime;

    Object.entries(wireframesRef.current).forEach(([region, wireframeArray]) => {
      wireframeArray.forEach(wireframe => {
        const material = wireframe.material as THREE.LineBasicMaterial;

        if (current) {
          if (region === current) {
            // Seçili bölge - parlak gümüş, pulse efekti
            const targetOpacity = 0.5 + 0.25 * Math.sin(time * 3);
            material.opacity += (targetOpacity - material.opacity) * 0.08;
            material.color.setRGB(
              0.7 + 0.3 * Math.sin(time * 2),
              0.75 + 0.25 * Math.sin(time * 2),
              0.9 + 0.1 * Math.sin(time * 2.5)
            );
          } else if (region === "default") {
            // Default bölge çok silik
            material.opacity += (0.03 - material.opacity) * 0.05;
            material.color.setRGB(0.2, 0.2, 0.25);
          } else {
            // Diğer bölgeler - silik
            material.opacity += (0.06 - material.opacity) * 0.05;
            material.color.setRGB(0.2, 0.2, 0.25);
          }
        } else {
          // Hiçbir şey seçili değil - nefes efekti
          const breathe = 0.2 + 0.1 * Math.sin(time * 1.2);
          if (region === "default") {
            material.opacity += (breathe * 0.5 - material.opacity) * 0.03;
          } else {
            material.opacity += (breathe - material.opacity) * 0.03;
          }
          material.color.setRGB(0.4, 0.42, 0.5);
        }
      });
    });
  });

  return <group ref={groupRef} />;
}

// Progress indicator dots
function ProgressDots({ activeIndex, total }: { activeIndex: number; total: number }) {
  return (
    <div className="fixed right-4 md:right-8 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2 md:gap-3">
      {Array.from({ length: total + 1 }).map((_, i) => (
        <div
          key={i}
          className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full transition-all duration-500 ${
            i === activeIndex
              ? 'bg-white scale-150'
              : 'bg-white/15 hover:bg-white/30'
          }`}
        />
      ))}
    </div>
  );
}

// Neural network style connection from brain to info card
function NeuralConnection({
  selectedRegion,
  cardRef
}: {
  selectedRegion: RegionKey | null;
  cardRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [paths, setPaths] = useState<string[]>([]);
  const [nodes, setNodes] = useState<{ x: number; y: number }[]>([]);

  useEffect(() => {
    if (!selectedRegion || !cardRef.current) {
      setPaths([]);
      setNodes([]);
      return;
    }

    const updatePaths = () => {
      const card = cardRef.current;
      if (!card) return;

      const cardRect = card.getBoundingClientRect();
      const startX = cardRect.right + 15;
      const startY = cardRect.top + cardRect.height / 2;

      const endX = window.innerWidth * 0.52;
      const endY = window.innerHeight * 0.5;

      // Nöron ağı noktaları - rastgele ara noktalar
      const midPoints: { x: number; y: number }[] = [];
      const numMidPoints = 4;

      for (let i = 0; i < numMidPoints; i++) {
        const t = (i + 1) / (numMidPoints + 1);
        const baseX = startX + (endX - startX) * t;
        const baseY = startY + (endY - startY) * t;
        // Rastgele sapma
        const offsetX = (Math.random() - 0.5) * 60;
        const offsetY = (Math.random() - 0.5) * 80;
        midPoints.push({ x: baseX + offsetX, y: baseY + offsetY });
      }

      // Ana yol + dallar
      const allPaths: string[] = [];
      const allNodes: { x: number; y: number }[] = [{ x: startX, y: startY }];

      // Ana sinir yolu
      let mainPath = `M ${startX} ${startY}`;
      midPoints.forEach((p, i) => {
        mainPath += ` L ${p.x} ${p.y}`;
        allNodes.push(p);
      });
      mainPath += ` L ${endX} ${endY}`;
      allNodes.push({ x: endX, y: endY });
      allPaths.push(mainPath);

      // Dallanmalar (2-3 tane)
      midPoints.forEach((p, i) => {
        if (i % 2 === 0) {
          const branchEndX = p.x + (Math.random() - 0.5) * 100;
          const branchEndY = p.y + (Math.random() - 0.5) * 60;
          allPaths.push(`M ${p.x} ${p.y} L ${branchEndX} ${branchEndY}`);
          allNodes.push({ x: branchEndX, y: branchEndY });
        }
      });

      setPaths(allPaths);
      setNodes(allNodes);
    };

    updatePaths();
    // Sadece scroll'da güncelle, her frame'de değil
    const handleScroll = () => updatePaths();
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [selectedRegion, cardRef]);

  if (paths.length === 0 || !selectedRegion) return null;

  return (
    <svg
      className="fixed inset-0 z-15 pointer-events-none"
      style={{ width: '100vw', height: '100vh' }}
    >
      <defs>
        <linearGradient id="neural-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(148, 163, 184, 0.5)" />
          <stop offset="100%" stopColor="rgba(148, 163, 184, 0.1)" />
        </linearGradient>
      </defs>

      {/* Nöron yolları */}
      {paths.map((path, i) => (
        <path
          key={i}
          d={path}
          stroke="url(#neural-gradient)"
          strokeWidth={i === 0 ? "1" : "0.5"}
          fill="none"
          opacity={i === 0 ? 0.6 : 0.3}
        />
      ))}

      {/* Sinaps noktaları */}
      {nodes.map((node, i) => (
        <circle
          key={i}
          cx={node.x}
          cy={node.y}
          r={i === 0 || i === nodes.length - 1 ? 3 : 2}
          fill="rgba(148, 163, 184, 0.5)"
        />
      ))}
    </svg>
  );
}

// Main Page Component
export default function Home() {
  const [selectedRegion, setSelectedRegion] = useState<RegionKey | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionsRef = useRef<HTMLDivElement[]>([]);
  const activeCardRef = useRef<HTMLDivElement>(null);

  // Mouse tracking for parallax
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 2;
    const y = (e.clientY / window.innerHeight - 0.5) * 2;
    setMousePosition({ x, y });
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  // Scroll progress tracking
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? scrollY / docHeight : 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll triggers
  useEffect(() => {
    // Hero section - no region selected
    ScrollTrigger.create({
      trigger: sectionsRef.current[0],
      start: "top top",
      end: "bottom center",
      onEnter: () => { setSelectedRegion(null); setActiveIndex(0); },
      onEnterBack: () => { setSelectedRegion(null); setActiveIndex(0); },
    });

    // Region sections
    REGION_KEYS.forEach((region, index) => {
      ScrollTrigger.create({
        trigger: sectionsRef.current[index + 1],
        start: "top center",
        end: "bottom center",
        onEnter: () => { setSelectedRegion(region); setActiveIndex(index + 1); },
        onEnterBack: () => { setSelectedRegion(region); setActiveIndex(index + 1); },
      });
    });

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  // Intersection Observer for reveal animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    document.querySelectorAll('.reveal-on-scroll').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={`${inter.variable} ${bebasNeue.variable} relative bg-black`}
    >
      {/* Fixed Brain Background */}
      <div className="fixed inset-0 z-0">
        {/* Ambient glow behind brain */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-1000"
          style={{
            background: selectedRegion
              ? 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.05) 40%, transparent 70%)'
              : 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(99, 102, 241, 0.06) 0%, transparent 60%)',
          }}
        />

        <Canvas
          camera={{ position: [0, 0, 12], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
        >
          <color attach="background" args={["#030508"]} />
          <ambientLight intensity={0.5} />
          <BrainModel selectedRegion={selectedRegion} mousePosition={mousePosition} />
          <CameraController
            selectedRegion={selectedRegion}
            scrollProgress={scrollProgress}
            mousePosition={mousePosition}
          />
        </Canvas>
      </div>

      {/* Subtle grid pattern */}
      <div
        className="fixed inset-0 z-[5] pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Grain overlay */}
      <div
        className="fixed inset-0 z-10 pointer-events-none opacity-[0.012]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50">
        {/* Subtle gradient backdrop */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none" />

        <nav className="relative flex items-center justify-between px-8 md:px-16 lg:px-20 py-6">
          {/* Logo + Brand */}
          <a href="#" className="flex items-center gap-3 group">
            {/* Logo */}
            <div className="relative w-10 h-10 md:w-11 md:h-11">
              <img
                src="/logo.png"
                alt="BrainArts Logo"
                className="w-full h-full object-contain opacity-90 group-hover:opacity-100 transition-opacity"
              />
              {/* Subtle glow on hover */}
              <div className="absolute inset-0 bg-white/5 rounded-full blur-xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Brand Text */}
            <div className="flex flex-col">
              <span className={`${bebasNeue.className} text-xl md:text-2xl text-white tracking-[0.2em] leading-none`}>
                BRAINARTS
              </span>
              <span className={`${inter.className} text-[9px] md:text-[10px] text-white/30 tracking-[0.15em] uppercase mt-0.5`}>
                Neural Intelligence
              </span>
            </div>
          </a>

          {/* Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-white/40 hover:text-white text-sm tracking-wide transition-colors duration-300">
              Özellikler
            </a>
            <a href="#about" className="text-white/40 hover:text-white text-sm tracking-wide transition-colors duration-300">
              Hakkında
            </a>
            <a href="#contact" className="text-white/40 hover:text-white text-sm tracking-wide transition-colors duration-300">
              İletişim
            </a>
            <button className="ml-4 px-5 py-2 border border-white/20 text-white/80 text-sm tracking-wide hover:bg-white hover:text-black hover:border-white transition-all duration-300">
              Demo Talep Et
            </button>
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden text-white/60 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </nav>
      </header>

      {/* Neural Connection - Brain to Card (desktop only) */}
      <div className="hidden md:block">
        <NeuralConnection selectedRegion={selectedRegion} cardRef={activeCardRef} />
      </div>

      {/* Progress Dots */}
      <ProgressDots activeIndex={activeIndex} total={REGION_KEYS.length} />

      {/* Scrollable Content */}
      <div className="relative z-20">
        {/* Hero Section */}
        <section
          ref={el => { if (el) sectionsRef.current[0] = el; }}
          className="h-screen flex flex-col items-center justify-between py-32"
        >
          {/* Tagline - top center */}
          <div className="text-center mt-16 opacity-0 animate-fade-in">
            <p className={`${inter.className} text-white/50 text-sm tracking-[0.25em] uppercase mb-6`}>
              Executable Semantic Graph Platform
            </p>
            <h1 className={`${bebasNeue.className} text-4xl md:text-6xl lg:text-7xl text-white tracking-wide leading-tight`}>
              <span className="text-white/50">BOM verisi statik değil,</span>
              <br />
              <span className="animated-gradient-text">
                çalıştırılabilir bir graf.
              </span>
            </h1>
            <p className={`${inter.className} text-white/30 text-sm md:text-base mt-6 max-w-xl mx-auto`}>
              Formül tabanlı propagation, ratio-only blind calculation, multi-tenant izolasyon
            </p>
          </div>

          {/* Spacer - brain görünecek alan */}
          <div className="flex-1" />

          {/* Scroll hint at bottom */}
          <div className="text-center">
            <p className={`${inter.className} text-white/20 text-xs tracking-[0.2em] uppercase mb-3`}>
              Keşfetmek için aşağı kaydırın
            </p>
            <div className="animate-bounce">
              <svg className="w-4 h-4 mx-auto text-white/15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
        </section>

        {/* Region Sections */}
        {REGION_KEYS.map((region, index) => {
          const info = BRAIN_REGIONS[region];
          const isLeft = index % 2 === 0;
          const isActive = selectedRegion === region;

          return (
            <section
              key={region}
              id={index === 0 ? "features" : index === 2 ? "about" : undefined}
              ref={el => { if (el) sectionsRef.current[index + 1] = el; }}
              className="min-h-screen flex items-center px-6 sm:px-12 md:px-24 lg:px-32"
            >
              <div
                className={`max-w-md ${
                  isLeft ? 'mr-auto' : 'ml-auto text-right'
                }`}
              >
                {/* Glass card wrapper */}
                <div
                  ref={isActive ? activeCardRef : null}
                  className={`relative p-6 -m-6 rounded-2xl transition-all duration-500 ${
                    isActive ? 'bg-white/[0.02] backdrop-blur-sm' : ''
                  }`}
                >
                  {/* Subtle border glow when active */}
                  {isActive && (
                    <div className="absolute inset-0 rounded-2xl border border-indigo-500/10" />
                  )}

                  {/* Number - Staggered animation delay: 0ms */}
                  <span className={`${bebasNeue.className} text-6xl sm:text-8xl md:text-9xl block mb-[-1.5rem] md:mb-[-2rem] transition-all duration-700 ${
                    isActive
                      ? 'text-indigo-400/[0.08] opacity-100 translate-y-0'
                      : 'text-white/[0.06] opacity-10 translate-y-4'
                  }`}
                  style={{ transitionDelay: isActive ? '0ms' : '0ms' }}
                  >
                    0{index + 1}
                  </span>

                  {/* Subtitle - Staggered animation delay: 100ms */}
                  <p className={`${inter.className} text-xs tracking-[0.2em] uppercase mb-2 transition-all duration-700 ${
                    isActive
                      ? 'text-indigo-300/50 opacity-100 translate-y-0'
                      : 'text-white/30 opacity-10 translate-y-4'
                  }`}
                  style={{ transitionDelay: isActive ? '100ms' : '0ms' }}
                  >
                    {info.subtitle}
                  </p>

                  {/* Title - Staggered animation delay: 200ms */}
                  <h3 className={`${bebasNeue.className} text-3xl sm:text-4xl md:text-5xl text-white tracking-wide mb-3 md:mb-4 transition-all duration-700 ${
                    isActive
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-10 translate-y-4'
                  }`}
                  style={{ transitionDelay: isActive ? '200ms' : '0ms' }}
                  >
                    {info.name}
                  </h3>

                  {/* Line with gradient when active - Staggered animation delay: 300ms */}
                  <div className={`h-px mb-6 transition-all duration-700 ${isLeft ? '' : 'ml-auto'} ${
                    isActive
                      ? 'w-16 bg-gradient-to-r from-indigo-500/50 to-purple-500/50 opacity-100'
                      : 'w-12 bg-white/15 opacity-10'
                  }`}
                  style={{ transitionDelay: isActive ? '300ms' : '0ms' }}
                  />

                  {/* Description - Staggered animation delay: 400ms */}
                  <p className={`${inter.className} text-white/40 text-sm leading-relaxed transition-all duration-700 ${
                    isActive
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-10 translate-y-4'
                  }`}
                  style={{ transitionDelay: isActive ? '400ms' : '0ms' }}
                  >
                    {info.description}
                  </p>
                </div>
              </div>
            </section>
          );
        })}

        {/* Features Grid Section */}
        <section className="min-h-screen flex items-center justify-center px-8 md:px-16 py-32">
          <div className="max-w-5xl w-full">
            {/* Section Header */}
            <div className="text-center mb-16">
              <p className={`${inter.className} text-indigo-400/60 text-xs tracking-[0.3em] uppercase mb-4`}>
                Platform Özellikleri
              </p>
              <h2 className={`${bebasNeue.className} text-4xl md:text-5xl text-white tracking-wide`}>
                Endüstriyel Zeka
              </h2>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Feature 1 - BOM Intelligence */}
              <div className="reveal-on-scroll group relative p-8 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/10 transition-all duration-500">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/10 flex items-center justify-center mb-6 border border-indigo-500/10">
                    <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                  <h3 className={`${bebasNeue.className} text-2xl text-white tracking-wide mb-3`}>
                    BOM Zekası
                  </h3>
                  <p className={`${inter.className} text-white/40 text-sm leading-relaxed`}>
                    Ürün ağacı verilerinizi otomatik analiz eder. Maliyet değişimlerini önceden tahmin eder, alternatif malzeme önerileri sunar.
                  </p>
                </div>
              </div>

              {/* Feature 2 - Cost Propagation */}
              <div className="reveal-on-scroll group relative p-8 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/10 transition-all duration-500">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 flex items-center justify-center mb-6 border border-purple-500/10">
                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <h3 className={`${bebasNeue.className} text-2xl text-white tracking-wide mb-3`}>
                    Maliyet Propagasyonu
                  </h3>
                  <p className={`${inter.className} text-white/40 text-sm leading-relaxed`}>
                    Bir malzeme fiyatı değiştiğinde, tüm etkilenen ürünlerin maliyeti anlık olarak güncellenir. Marj ve teklif fiyatları otomatik hesaplanır.
                  </p>
                </div>
              </div>

              {/* Feature 3 - RFQ Workflow */}
              <div className="reveal-on-scroll group relative p-8 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/10 transition-all duration-500">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 flex items-center justify-center mb-6 border border-cyan-500/10">
                    <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <h3 className={`${bebasNeue.className} text-2xl text-white tracking-wide mb-3`}>
                    Teklif Yönetimi
                  </h3>
                  <p className={`${inter.className} text-white/40 text-sm leading-relaxed`}>
                    RFQ'dan seri üretime kadar tüm teklif sürecini yönetin. Müşteri revizyonları, onay akışları ve versiyonlama dahil.
                  </p>
                </div>
              </div>

              {/* Feature 4 - AI Agents */}
              <div className="reveal-on-scroll group relative p-8 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/10 transition-all duration-500">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center mb-6 border border-amber-500/10">
                    <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className={`${bebasNeue.className} text-2xl text-white tracking-wide mb-3`}>
                    AI Agents (MCP)
                  </h3>
                  <p className={`${inter.className} text-white/40 text-sm leading-relaxed`}>
                    Model Context Protocol ile AI asistanlarınız BOM verilerinize güvenle erişir. Analiz ve raporlama görevlerini otomatize eder.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section - Frosted Glass */}
        <section id="contact" className="min-h-screen flex items-center justify-center px-8 md:px-16">
          <div className="relative max-w-lg w-full">
            {/* Frosted glass card */}
            <div className="relative backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-2xl p-8 md:p-12">
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none" />

              <div className="relative text-center">
                <h3 className={`${bebasNeue.className} text-4xl md:text-5xl text-white tracking-wide mb-4`}>
                  İLETİŞİME GEÇİN
                </h3>
                <p className={`${inter.className} text-white/40 text-sm mb-8`}>
                  Projeleriniz için bizimle iletişime geçin
                </p>

                <form className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Adınız"
                      className="w-full px-4 py-3 bg-white/[0.03] backdrop-blur border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:bg-white/[0.05] transition-all text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Soyadınız"
                      className="w-full px-4 py-3 bg-white/[0.03] backdrop-blur border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:bg-white/[0.05] transition-all text-sm"
                    />
                  </div>
                  <input
                    type="email"
                    placeholder="E-posta"
                    className="w-full px-4 py-3 bg-white/[0.03] backdrop-blur border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:bg-white/[0.05] transition-all text-sm"
                  />
                  <textarea
                    placeholder="Mesajınız"
                    rows={4}
                    className="w-full px-4 py-3 bg-white/[0.03] backdrop-blur border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:bg-white/[0.05] transition-all text-sm resize-none"
                  />
                  <button
                    type="submit"
                    className="w-full py-4 bg-white text-black text-sm font-medium rounded-lg hover:bg-white/90 transition-colors"
                  >
                    GÖNDER
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-10 px-6 md:px-12 border-t border-white/5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Logo + Brand */}
            <a href="#" className="flex items-center gap-2 opacity-40 hover:opacity-60 transition-opacity">
              <img src="/logo.png" alt="BrainArts" className="w-6 h-6 object-contain" />
              <span className={`${bebasNeue.className} text-white tracking-[0.15em]`}>BRAINARTS</span>
            </a>

            {/* Links */}
            <div className="flex items-center gap-6">
              <a href="#" className={`${inter.className} text-white/20 text-xs hover:text-white/40 transition-colors`}>Gizlilik</a>
              <a href="#" className={`${inter.className} text-white/20 text-xs hover:text-white/40 transition-colors`}>Kullanım Şartları</a>
            </div>

            {/* Copyright */}
            <span className={`${inter.className} text-white/20 text-xs`}>© 2025 BrainArts. Tüm hakları saklıdır.</span>
          </div>
        </footer>
      </div>

      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 1.2s ease-out 0.5s forwards;
        }

        /* Animated gradient text */
        .animated-gradient-text {
          background: linear-gradient(
            90deg,
            #e2e8f0 0%,
            #a5b4fc 20%,
            #c4b5fd 40%,
            #e2e8f0 60%,
            #a5b4fc 80%,
            #c4b5fd 100%
          );
          background-size: 200% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradient-shift 4s ease-in-out infinite;
        }

        @keyframes gradient-shift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        /* Scroll reveal animation for feature cards */
        .reveal-on-scroll {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.8s ease-out, transform 0.8s ease-out;
        }

        .reveal-on-scroll.revealed {
          opacity: 1;
          transform: translateY(0);
        }

        /* Staggered delays for cards */
        .reveal-on-scroll:nth-child(1) { transition-delay: 0ms; }
        .reveal-on-scroll:nth-child(2) { transition-delay: 150ms; }
        .reveal-on-scroll:nth-child(3) { transition-delay: 300ms; }
        .reveal-on-scroll:nth-child(4) { transition-delay: 450ms; }

        /* Animated dash for connection line */
        @keyframes dash-flow {
          from {
            stroke-dashoffset: 24;
          }
          to {
            stroke-dashoffset: 0;
          }
        }

        .animate-dash {
          animation: dash-flow 1s linear infinite;
        }
      `}</style>
    </div>
  );
}

useGLTF.preload(BRAIN_MODEL);
