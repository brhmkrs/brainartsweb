"use client";

import { useEffect, useRef, useState, Suspense, useMemo, createContext, useContext } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Environment, Center, Text3D, Float } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { Bebas_Neue, Inter } from "next/font/google";

// ============ TRANSLATIONS ============
type Lang = "tr" | "en";

const translations = {
  tr: {
    // Header
    tagline: "Neural Intelligence",
    nav: {
      features: "Özellikler",
      about: "Hakkında",
      demo: "Demo Talep Et",
    },
    // Hero
    heroTitle: "BRAINARTS",
    heroSubtitle: "Executional Semantic Graph",
    heroTagline: "ERP'NİZİ AI-READY HALE GETİRİN",
    heroDescription: "Mevcut ERP sistemlerinize entegre olan semantik zeka katmanı. AI Agent'ların anlayıp karar verebileceği, yaşayan bir kurumsal hafıza.",
    scrollHint: "Keşfetmek için kaydırın",
    // Footer
    footerTitle: "GELECEĞİ ŞEKİLLENDİRİN",
    footerSubtitle: "BrainArts ile endüstriyel zekanızı bir üst seviyeye taşıyın.",
    copyright: "© 2026 BrainArts. Tüm hakları saklıdır.",
    // Brain Regions
    regions: {
      frontal: {
        name: "Frontal Lob",
        subtitle: "Aksiyon Merkezi",
        function: "Dinamik İş Akışı ve Yayılım Motoru",
        description: "Tek veri değişikliği → otomatik aksiyonlar, onaylar ve uyarılar. Tüm ERP ekosistemi anında tepki verir.",
        punchline: "Tek bir kıvılcım, tüm organizasyonda doğru aksiyona dönüşür; değişim anında yayılır.",
      },
      temporal: {
        name: "Temporal Lob",
        subtitle: "Anlam Motoru",
        function: "Semantik Sorgulama ve Yapay Zeka Katmanı",
        description: "Doğal dille soru sor, bağlamsal yanıt al. Karmaşık maliyet analizleri artık bir sohbet kadar kolay.",
        punchline: "Veriler artık sadece rakam değil; şirketinizin ne söylemek istediğini anlayan yaşayan bir lisan.",
      },
      parietal: {
        name: "Parietal Lob",
        subtitle: "Kontrol Merkezi",
        function: "3D BOM Navigator ve Graf Motoru",
        description: "Milyonlarca parça, tek bir görsel harita. Tüm BOM ağacını ve bağımlılıkları anında kavra.",
        punchline: "Karmaşanın içinde yolunuzu kaybetmeyin; tüm üretim evrenine tek bir noktadan hükmedin.",
      },
      occipital: {
        name: "Oksipital Lob",
        subtitle: "Analiz Gözü",
        function: "İleri Düzey Maliyet Analizi ve Görselleştirme",
        description: "Maliyet katmanları, trendler ve kârlılık projeksiyonları kristal netliğinde görselleşir.",
        punchline: "Görünmeyeni görün; maliyetin her katmanındaki potansiyeli kristal netliğinde keşfedin.",
      },
      cerebellum: {
        name: "Serebellum",
        subtitle: "Denge Merkezi",
        function: "ESG (Executional Semantic Graph) Temel Mimarisi",
        description: "Üç katmanlı mimari: tüm varlıklar anlamsal olarak bağlı, veri tutarlılığı garantili.",
        punchline: "Bağlantısız hiçbir veri kalmaz; Brainarts ESG, şirketinizin parçalanmış hafızasını birleştirir.",
      },
    },
    // Features Modal
    featuresModal: {
      title: "Özellikler",
      intro: "Beyin Mimarisi",
      esgTitle: "Executional Semantic Graph",
      esgDesc: "Her beyin bölgesi, BrainArts ESG platformunun farklı bir yeteneğini temsil eder. Tıpkı insan beyni gibi, bu bölgeler birbirleriyle sürekli iletişim halinde çalışır.",
      summaryTitle: "Birleşik Zeka",
      summaryDesc: "BrainArts ESG, endüstriyel operasyonlarınızı tek bir semantik graf üzerinde birleştirir. Kopuk ERP tabloları yerine, birbirine bağlı ve anlamlı bir kurumsal hafıza oluşturur.",
      summaryHighlight: "Değişiklikler anında yayılır, kararlar veriye dayanır, karmaşıklık basitliğe dönüşür.",
    },
    // About Modal
    aboutModal: {
      title: "Hakkında",
      heroIntro: "Endüstriyel Zekanın Yeni İşletim Sistemi",
      heroDesc: "BrainArts, karmaşık endüstriyel operasyonları yönetmek ve dönüştürmek için kurgulanmış, dünyanın en gelişmiş Executional Semantic Graph (ESG) platformudur.",
      whatWeDo: "Geleneksel, statik ve birbirinden kopuk BOM (Ürün Ağacı) sistemlerinin ötesine geçiyoruz. Veriyi sadece saklayan bir depo değil; veriyi anlayan, ilişkilendiren ve otomatik olarak yürüten yaşayan bir graf yapısı inşa ediyoruz.",
      whyTitle: "Neden BrainArts?",
      whySubtitle: "Sıradan yazılımlar veri tutar; BrainArts ise veriyi harekete geçirir.",
      feature1Title: "Executional Semantic Graph",
      feature1Desc: "Veriler arasındaki anlamsal bağları kurarak, her veri noktasını çalıştırılabilir birer zeka hücresine dönüştürür.",
      feature2Title: "Formula-Based Propagation",
      feature2Desc: "Graf üzerindeki tek bir girdi değişikliğinin, tüm sistem boyunca bir sinir sinyali gibi yayılmasını ve sonuçları anlık olarak güncellemesini sağlar.",
      feature3Title: "Ratio-Only Blind Calculation",
      feature3Desc: "Hassas verileri korurken, karmaşık maliyet ve oran analizlerini en yüksek güvenlik ve gizlilik standartlarında gerçekleştirir.",
      feature4Title: "Multi-Tenant Isolation",
      feature4Desc: "Her kuruma özel, izole ve siber güvenlik odaklı bir mimari sunarak endüstriyel sırlarınızı korur.",
      visionTitle: "Vizyonumuz: Otonom İş Zekası (ABI)",
      visionDesc: "Biz, fabrikanızın veya işletmenizin tüm operasyonlarını yöneten bir Industrial Operating System kuruyoruz. Hedefimiz, BOM dünyasını sadece insanların değil, AI Agent'ların da anlayıp yönetebileceği devasa bir ekosisteme dönüştürmek.",
      visionHighlight: "BrainArts ile işletmeniz artık sadece yönetilmiyor; kendi kararlarını verebilen otonom bir yapıya evriliyor.",
      contactTitle: "İletişim",
      contactDesc: "Geleceğin endüstriyel zekasını birlikte inşa edelim.",
    },
    // Demo Modal
    demoModal: {
      title: "Demo Talep Et",
      nameLabel: "Ad Soyad *",
      namePlaceholder: "Adınız Soyadınız",
      emailLabel: "E-posta *",
      emailPlaceholder: "ornek@sirket.com",
      companyLabel: "Şirket",
      companyPlaceholder: "Şirket Adı",
      messageLabel: "Mesajınız",
      messagePlaceholder: "Demo hakkında sorularınız veya özel talepleriniz...",
      submitButton: "Demo Talep Et",
      submitting: "Gönderiliyor...",
      successTitle: "Talebiniz Alındı",
      successDesc: "En kısa sürede sizinle iletişime geçeceğiz.",
      closeButton: "Kapat",
      errorMessage: "Bir hata oluştu. Lütfen tekrar deneyin.",
    },
  },
  en: {
    // Header
    tagline: "Neural Intelligence",
    nav: {
      features: "Features",
      about: "About",
      demo: "Request Demo",
    },
    // Hero
    heroTitle: "BRAINARTS",
    heroSubtitle: "Executional Semantic Graph",
    heroTagline: "Make Your ERP AI-Ready",
    heroDescription: "A semantic intelligence layer that integrates with your existing ERP systems. A living corporate memory that AI Agents can understand and make decisions from.",
    scrollHint: "Scroll to explore",
    // Footer
    footerTitle: "SHAPE THE FUTURE",
    footerSubtitle: "Elevate your industrial intelligence with BrainArts.",
    copyright: "© 2026 BrainArts. All rights reserved.",
    // Brain Regions
    regions: {
      frontal: {
        name: "Frontal Lobe",
        subtitle: "Action Center",
        function: "Dynamic Workflow & Propagation Engine",
        description: "One data change → automatic actions, approvals, and alerts. The entire ERP ecosystem responds instantly.",
        punchline: "A single spark transforms into the right action across your organization; change propagates instantly.",
      },
      temporal: {
        name: "Temporal Lobe",
        subtitle: "Meaning Engine",
        function: "Semantic Query & AI Layer",
        description: "Ask questions in natural language, get contextual answers. Complex cost analysis is now as easy as a conversation.",
        punchline: "Data is no longer just numbers; it's a living language that understands what your company wants to say.",
      },
      parietal: {
        name: "Parietal Lobe",
        subtitle: "Control Center",
        function: "3D BOM Navigator & Graph Engine",
        description: "Millions of parts, one visual map. Instantly grasp the entire BOM tree and dependencies.",
        punchline: "Don't lose your way in complexity; command your entire production universe from a single point.",
      },
      occipital: {
        name: "Occipital Lobe",
        subtitle: "Analysis Eye",
        function: "Advanced Cost Analysis & Visualization",
        description: "Cost layers, trends, and profitability projections visualized with crystal clarity.",
        punchline: "See the invisible; discover the potential in every layer of cost with crystal clarity.",
      },
      cerebellum: {
        name: "Cerebellum",
        subtitle: "Balance Center",
        function: "ESG (Executional Semantic Graph) Core Architecture",
        description: "Three-layer architecture: all entities semantically connected, data consistency guaranteed.",
        punchline: "No data left unconnected; Brainarts ESG unifies your company's fragmented memory.",
      },
    },
    // Features Modal
    featuresModal: {
      title: "Features",
      intro: "Brain Architecture",
      esgTitle: "Executional Semantic Graph",
      esgDesc: "Each brain region represents a different capability of the BrainArts ESG platform. Just like the human brain, these regions work in constant communication with each other.",
      summaryTitle: "Unified Intelligence",
      summaryDesc: "BrainArts ESG unifies your industrial operations on a single semantic graph. Instead of disconnected ERP tables, it creates an interconnected and meaningful corporate memory.",
      summaryHighlight: "Changes propagate instantly, decisions are data-driven, complexity transforms into simplicity.",
    },
    // About Modal
    aboutModal: {
      title: "About",
      heroIntro: "The New Operating System for Industrial Intelligence",
      heroDesc: "BrainArts is the world's most advanced Executional Semantic Graph (ESG) platform, designed to manage and transform complex industrial operations.",
      whatWeDo: "We go beyond traditional, static, and disconnected BOM (Bill of Materials) systems. We're building not just a repository that stores data, but a living graph structure that understands, connects, and automatically executes data.",
      whyTitle: "Why BrainArts?",
      whySubtitle: "Ordinary software stores data; BrainArts puts data into action.",
      feature1Title: "Executional Semantic Graph",
      feature1Desc: "By establishing semantic connections between data, it transforms every data point into an executable intelligence cell.",
      feature2Title: "Formula-Based Propagation",
      feature2Desc: "Enables a single input change on the graph to propagate like a nerve signal throughout the system and update results instantly.",
      feature3Title: "Ratio-Only Blind Calculation",
      feature3Desc: "Performs complex cost and ratio analyses at the highest security and privacy standards while protecting sensitive data.",
      feature4Title: "Multi-Tenant Isolation",
      feature4Desc: "Protects your industrial secrets by providing a customized, isolated, and cybersecurity-focused architecture for each organization.",
      visionTitle: "Our Vision: Autonomous Business Intelligence (ABI)",
      visionDesc: "We're building an Industrial Operating System that manages all operations of your factory or business. Our goal is to transform the BOM world into a massive ecosystem that not only humans but also AI Agents can understand and manage.",
      visionHighlight: "With BrainArts, your business is no longer just managed; it evolves into an autonomous structure that can make its own decisions.",
      contactTitle: "Contact",
      contactDesc: "Let's build the industrial intelligence of the future together.",
    },
    // Demo Modal
    demoModal: {
      title: "Request Demo",
      nameLabel: "Full Name *",
      namePlaceholder: "Your Full Name",
      emailLabel: "Email *",
      emailPlaceholder: "example@company.com",
      companyLabel: "Company",
      companyPlaceholder: "Company Name",
      messageLabel: "Your Message",
      messagePlaceholder: "Questions about the demo or special requests...",
      submitButton: "Request Demo",
      submitting: "Sending...",
      successTitle: "Request Received",
      successDesc: "We will contact you as soon as possible.",
      closeButton: "Close",
      errorMessage: "An error occurred. Please try again.",
    },
  },
};

// Language Context
const LangContext = createContext<{
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: typeof translations.tr;
}>({
  lang: "tr",
  setLang: () => {},
  t: translations.tr,
});

const useLang = () => useContext(LangContext);

// Fonts
const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  variable: "--font-bebas"
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
});

// Config
const BRAIN_MODEL = "/human_brain.glb";
const MODEL_SCALE = 0.02;

// Parent node -> Region mapping
const PARENT_TO_REGION: Record<string, string> = {
  "cereb1": "cerebellum",
  "frontal1": "frontal",
  "occipit1": "occipital",
  "pariet1": "parietal",
  "temp1": "temporal",
  "brain1": "brainstem",
};

// Brain regions - Camera positions only (texts come from translations)
const BRAIN_REGIONS = {
  frontal: {
    cameraOffset: { x: 5.2, y: 3, z: 4.5 },
  },
  temporal: {
    cameraOffset: { x: 7, y: 0, z: 2 },
  },
  parietal: {
    cameraOffset: { x: -3, y: 2, z: 6 },
  },
  occipital: {
    cameraOffset: { x: -5.3, y: 0, z: 5.3 },
  },
  cerebellum: {
    cameraOffset: { x: -2, y: -3, z: -8 },
  },
};

type RegionKey = keyof typeof BRAIN_REGIONS;
const REGION_KEYS = Object.keys(BRAIN_REGIONS) as RegionKey[];

// Get mesh region
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

// Mercury Material - shared
function useMercuryMaterial(isSelected: boolean, isOther: boolean) {
  return useMemo(() => {
    if (isSelected) {
      // Selected: bright mercury with subtle cool emissive
      return new THREE.MeshStandardMaterial({
        color: "#d8d8d8",
        emissive: "#334455",
        emissiveIntensity: 0.15,
        metalness: 1.0,
        roughness: 0.0,
        envMapIntensity: 2.2,
      });
    } else if (isOther) {
      // Others: much darker for contrast
      return new THREE.MeshStandardMaterial({
        color: "#040404",
        metalness: 1.0,
        roughness: 0.5,
        envMapIntensity: 0.02,
      });
    } else {
      return new THREE.MeshStandardMaterial({
        color: "#b8b8b8",
        metalness: 1.0,
        roughness: 0.0,
        envMapIntensity: 1.5,
      });
    }
  }, [isSelected, isOther]);
}

// 3D Metallic Text Component
function MetallicText3D({
  text,
  position,
  size = 0.5,
  opacity = 1
}: {
  text: string;
  position: [number, number, number];
  size?: number;
  opacity?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Subtle float animation
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
  });

  return (
    <Center position={position}>
      <Text3D
        ref={meshRef}
        font="/fonts/bebas_neue_regular.json"
        size={size}
        height={0.1}
        bevelEnabled
        bevelThickness={0.02}
        bevelSize={0.01}
        bevelSegments={5}
      >
        {text}
        <meshStandardMaterial
          color="#c0c0c0"
          metalness={1}
          roughness={0.05}
          envMapIntensity={2}
          transparent
          opacity={opacity}
        />
      </Text3D>
    </Center>
  );
}

// Camera Controller - cinematic smooth transitions
function CameraController({
  selectedRegion,
  mousePosition,
  isMobile
}: {
  selectedRegion: RegionKey | null;
  mousePosition: { x: number; y: number };
  isMobile: boolean;
}) {
  const { camera } = useThree();
  // On mobile, camera is further back
  const defaultZ = isMobile ? 12 : 8;
  const currentPos = useRef({ x: 0, y: 0, z: defaultZ });
  const velocity = useRef({ x: 0, y: 0, z: 0 });

  useFrame(() => {
    // Determine target position
    let targetPos = { x: 0, y: 0, z: defaultZ };

    if (selectedRegion) {
      const regionData = BRAIN_REGIONS[selectedRegion];
      // On mobile, pull camera back more
      const mobileScale = isMobile ? 1.4 : 1;
      targetPos = {
        x: regionData.cameraOffset.x * mobileScale,
        y: regionData.cameraOffset.y * mobileScale,
        z: regionData.cameraOffset.z * mobileScale
      };
    }

    // Mouse influence only when no region selected (disabled on mobile)
    if (!selectedRegion && !isMobile) {
      targetPos.x += mousePosition.x * 0.3;
      targetPos.y -= mousePosition.y * 0.2;
    }

    // Cinematic spring physics
    const stiffness = 0.025;  // How fast it moves toward target
    const damping = 0.88;     // How much it slows down

    // Calculate spring force
    const forceX = (targetPos.x - currentPos.current.x) * stiffness;
    const forceY = (targetPos.y - currentPos.current.y) * stiffness;
    const forceZ = (targetPos.z - currentPos.current.z) * stiffness;

    // Apply force to velocity
    velocity.current.x += forceX;
    velocity.current.y += forceY;
    velocity.current.z += forceZ;

    // Apply damping
    velocity.current.x *= damping;
    velocity.current.y *= damping;
    velocity.current.z *= damping;

    // Update position
    currentPos.current.x += velocity.current.x;
    currentPos.current.y += velocity.current.y;
    currentPos.current.z += velocity.current.z;

    // Minimum distance from center (higher on mobile)
    const minRadius = isMobile ? 9 : 6.5;
    const currentRadius = Math.sqrt(
      currentPos.current.x ** 2 +
      currentPos.current.y ** 2 +
      currentPos.current.z ** 2
    );
    if (currentRadius < minRadius) {
      const scale = minRadius / currentRadius;
      currentPos.current.x *= scale;
      currentPos.current.y *= scale;
      currentPos.current.z *= scale;
    }

    camera.position.set(currentPos.current.x, currentPos.current.y, currentPos.current.z);
    camera.lookAt(0, 0, 0);
  });

  return null;
}

// Mercury Brain
function MercuryBrain({
  selectedRegion,
  onRegionClick,
  isMobile,
}: {
  selectedRegion: RegionKey | null;
  onRegionClick: (region: RegionKey | null) => void;
  isMobile: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(BRAIN_MODEL);
  const { raycaster, camera, gl } = useThree();
  const pointer = useMemo(() => new THREE.Vector2(), []);
  // Scale down on mobile
  const scale = isMobile ? MODEL_SCALE * 0.85 : MODEL_SCALE;

  useFrame((state) => {
    if (groupRef.current && !selectedRegion) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.2;
    }
  });

  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const meshRegion = getMeshRegion(child);
        const isSelected = selectedRegion && meshRegion === selectedRegion;
        const isOtherSelected = selectedRegion && meshRegion !== selectedRegion;

        if (isSelected) {
          // Selected: bright mercury with subtle cool emissive
          child.material = new THREE.MeshStandardMaterial({
            color: "#d8d8d8",
            emissive: "#334455",
            emissiveIntensity: 0.15,
            metalness: 1.0,
            roughness: 0.0,
            envMapIntensity: 2.2,
          });
        } else if (isOtherSelected) {
          // Others: much darker for contrast
          child.material = new THREE.MeshStandardMaterial({
            color: "#040404",
            metalness: 1.0,
            roughness: 0.5,
            envMapIntensity: 0.02,
          });
        } else {
          child.material = new THREE.MeshStandardMaterial({
            color: "#b8b8b8",
            metalness: 1.0,
            roughness: 0.0,
            envMapIntensity: 1.5,
          });
        }
      }
    });
  }, [scene, selectedRegion]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        const mesh = intersects[0].object as THREE.Mesh;
        const region = getMeshRegion(mesh) as RegionKey | null;

        if (region && BRAIN_REGIONS[region]) {
          onRegionClick(selectedRegion === region ? null : region);
        }
      }
    };

    gl.domElement.addEventListener("click", handleClick);
    return () => gl.domElement.removeEventListener("click", handleClick);
  }, [selectedRegion, onRegionClick, raycaster, camera, gl, scene, pointer]);

  return (
    <group ref={groupRef} scale={scale}>
      <Center>
        <primitive object={scene} />
      </Center>
    </group>
  );
}

// Progress Dots - hidden on mobile
function ProgressDots({ activeIndex, total }: { activeIndex: number; total: number }) {
  return (
    <div className="hidden md:flex fixed right-8 top-1/2 -translate-y-1/2 z-40 flex-col gap-3">
      {Array.from({ length: total + 1 }).map((_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full transition-all duration-500 ${
            i === activeIndex ? "bg-white scale-125" : "bg-white/20"
          }`}
        />
      ))}
    </div>
  );
}

// Modal Component
type ModalType = "features" | "about" | "demo" | null;

function Modal({
  isOpen,
  onClose,
  children,
  title
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal Content */}
      <div
        className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors z-10"
        >
          <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="px-4 md:px-10 py-6 md:py-8 border-b border-white/5">
          <h2 className="font-bebas text-2xl md:text-4xl tracking-wide metallic-text-title-animated">
            {title}
          </h2>
        </div>

        {/* Body */}
        <div className="px-4 md:px-10 py-6 md:py-8">
          {children}
        </div>
      </div>
    </div>
  );
}

// Features Modal Content
function FeaturesContent({ t }: { t: typeof translations.tr }) {
  const regionKeys: RegionKey[] = ["frontal", "temporal", "parietal", "occipital", "cerebellum"];

  return (
    <div className="space-y-10">
      {/* Intro */}
      <div>
        <p className="text-xs tracking-[0.3em] uppercase text-white/30 mb-3">{t.featuresModal.intro}</p>
        <h3 className="font-bebas text-3xl md:text-4xl metallic-text-title-animated mb-4">
          <span className="executional-shimmer">Executional</span> Semantic Graph
        </h3>
        <p className="text-white/50 leading-relaxed text-base">
          {t.featuresModal.esgDesc}
        </p>
      </div>

      {/* Features Grid */}
      <div className="space-y-8">
        {regionKeys.map((key, i) => {
          const region = t.regions[key];
          return (
            <div key={i} className="flex gap-6 items-start group">
              <div className="relative">
                <span className="font-bebas text-6xl md:text-7xl metallic-number-animated">0{i + 1}</span>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 metallic-line-animated rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
              <div className="flex-1 pt-2">
                <div className="flex items-center gap-4 mb-3">
                  <h3 className="font-bebas text-2xl md:text-3xl metallic-text">{region.name}</h3>
                  <span className="text-[10px] tracking-[0.2em] uppercase text-white/30 px-2 py-1 bg-white/5 rounded">{region.subtitle}</span>
                </div>
                <p className="text-base metallic-bold mb-2">{region.function}</p>
                <p className="text-sm text-white/45 leading-relaxed">{region.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="pt-8 border-t border-white/10">
        <h3 className="font-bebas text-2xl metallic-text-title-animated mb-4">{t.featuresModal.summaryTitle}</h3>
        <p className="text-white/50 leading-relaxed text-base">
          {t.featuresModal.summaryDesc}
          <span className="text-white/70"> {t.featuresModal.summaryHighlight}</span>
        </p>
      </div>
    </div>
  );
}

// About Modal Content
function AboutContent({ t }: { t: typeof translations.tr }) {
  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <div>
        <p className="text-xs tracking-[0.3em] uppercase text-white/30 mb-3">{t.aboutModal.heroIntro}</p>
        <h3 className="font-bebas text-3xl md:text-4xl metallic-text-title-animated mb-6">BrainArts</h3>
        <p className="text-white/60 leading-relaxed text-base">
          {t.aboutModal.heroDesc.split("Executional")[0]}
          <span className="executional-shimmer">Executional</span>
          {t.aboutModal.heroDesc.split("Executional")[1]}
        </p>
      </div>

      {/* What We Do */}
      <div>
        <p className="text-white/50 leading-relaxed text-base mb-4">
          {t.aboutModal.whatWeDo}
        </p>
      </div>

      {/* Why BrainArts */}
      <div>
        <h4 className="font-bebas text-2xl metallic-text mb-2">{t.aboutModal.whyTitle}</h4>
        <p className="text-sm text-white/40 italic mb-6">{t.aboutModal.whySubtitle}</p>

        <div className="space-y-5">
          <div className="flex gap-4">
            <div className="w-1 metallic-line-vertical rounded-full flex-shrink-0" />
            <div>
              <h5 className="text-sm font-medium mb-1">
                <span className="executional-shimmer">Executional</span> <span className="metallic-bold">Semantic Graph</span>
              </h5>
              <p className="text-sm text-white/45 leading-relaxed">
                {t.aboutModal.feature1Desc}
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-1 metallic-line-vertical rounded-full flex-shrink-0" />
            <div>
              <h5 className="text-sm font-medium metallic-bold mb-1">{t.aboutModal.feature2Title}</h5>
              <p className="text-sm text-white/45 leading-relaxed">
                {t.aboutModal.feature2Desc}
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-1 metallic-line-vertical rounded-full flex-shrink-0" />
            <div>
              <h5 className="text-sm font-medium metallic-bold mb-1">{t.aboutModal.feature3Title}</h5>
              <p className="text-sm text-white/45 leading-relaxed">
                {t.aboutModal.feature3Desc}
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-1 metallic-line-vertical rounded-full flex-shrink-0" />
            <div>
              <h5 className="text-sm font-medium metallic-bold mb-1">{t.aboutModal.feature4Title}</h5>
              <p className="text-sm text-white/45 leading-relaxed">
                {t.aboutModal.feature4Desc}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Vision */}
      <div className="pt-6 border-t border-white/10">
        <h4 className="font-bebas text-2xl metallic-text mb-2">{t.aboutModal.visionTitle}</h4>
        <p className="text-white/50 leading-relaxed text-base mb-4">
          {t.aboutModal.visionDesc}
        </p>
        <p className="text-white/60 leading-relaxed text-base italic">
          {t.aboutModal.visionHighlight}
        </p>
      </div>

      {/* Contact */}
      <div className="pt-6 border-t border-white/10">
        <h4 className="font-bebas text-xl metallic-text mb-3">{t.aboutModal.contactTitle}</h4>
        <p className="text-white/40 text-sm mb-2">{t.aboutModal.contactDesc}</p>
        <a href="mailto:brainfo@brainarts.com.tr" className="metallic-bold hover:opacity-80 transition-opacity text-sm">
          brainfo@brainarts.com.tr
        </a>
      </div>
    </div>
  );
}

// Demo Request Modal Content
function DemoContent({ t, onClose }: { t: typeof translations.tr; onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: ""
  });
  const [submitted, setSubmitted] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        alert(t.demoModal.errorMessage);
      }
    } catch (error) {
      console.error("Error:", error);
      alert(t.demoModal.errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="font-bebas text-2xl metallic-text mb-4">{t.demoModal.successTitle}</h3>
        <p className="text-white/50 mb-8">{t.demoModal.successDesc}</p>
        <button
          onClick={onClose}
          className="metallic-button-dark px-8 py-3 text-sm font-medium tracking-wider"
        >
          <span className="metallic-text-hero">{t.demoModal.closeButton}</span>
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm text-white/40 mb-2">{t.demoModal.nameLabel}</label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={e => setFormData({...formData, name: e.target.value})}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
          placeholder={t.demoModal.namePlaceholder}
        />
      </div>

      <div>
        <label className="block text-sm text-white/40 mb-2">{t.demoModal.emailLabel}</label>
        <input
          type="email"
          required
          value={formData.email}
          onChange={e => setFormData({...formData, email: e.target.value})}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
          placeholder={t.demoModal.emailPlaceholder}
        />
      </div>

      <div>
        <label className="block text-sm text-white/40 mb-2">{t.demoModal.companyLabel}</label>
        <input
          type="text"
          value={formData.company}
          onChange={e => setFormData({...formData, company: e.target.value})}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
          placeholder={t.demoModal.companyPlaceholder}
        />
      </div>

      <div>
        <label className="block text-sm text-white/40 mb-2">{t.demoModal.messageLabel}</label>
        <textarea
          value={formData.message}
          onChange={e => setFormData({...formData, message: e.target.value})}
          rows={4}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors resize-none"
          placeholder={t.demoModal.messagePlaceholder}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full metallic-button-dark px-8 py-4 text-base font-medium tracking-wider disabled:opacity-50"
      >
        <span className="metallic-text-hero">
          {isLoading ? t.demoModal.submitting : t.demoModal.submitButton}
        </span>
      </button>
    </form>
  );
}

// Main Component
export default function Home() {
  const [selectedRegion, setSelectedRegion] = useState<RegionKey | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [activeIndex, setActiveIndex] = useState(0);
  const [openModal, setOpenModal] = useState<ModalType>(null);
  const sectionsRef = useRef<(HTMLElement | null)[]>([]);
  const [lang, setLang] = useState<Lang>("tr");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const t = translations[lang];

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const viewportCenter = windowHeight / 2;

      let closestSection = 0;
      let closestDistance = Infinity;

      sectionsRef.current.forEach((section, index) => {
        if (!section) return;
        const rect = section.getBoundingClientRect();
        const sectionCenter = rect.top + rect.height / 2;
        const distance = Math.abs(sectionCenter - viewportCenter);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestSection = index;
        }
      });

      setActiveIndex(closestSection);

      if (closestSection === 0 || closestSection === REGION_KEYS.length + 1) {
        setSelectedRegion(null);
      } else if (closestSection > 0 && closestSection <= REGION_KEYS.length) {
        setSelectedRegion(REGION_KEYS[closestSection - 1]);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={`${bebasNeue.variable} ${inter.variable} min-h-screen bg-[#030303]`}>
      {/* 3D Canvas */}
      <div className="fixed inset-0 z-0">
        <Canvas
          camera={{ position: [0, 0, 8], fov: 45 }}
          gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
        >
          <color attach="background" args={["#030303"]} />

          <Suspense fallback={null}>
            <ambientLight intensity={0.4} />
            <directionalLight position={[5, 5, 5]} intensity={1} />
            <directionalLight position={[-5, -5, -5]} intensity={0.3} />
            <Environment preset="studio" background={false} />

            <CameraController selectedRegion={selectedRegion} mousePosition={mousePosition} isMobile={isMobile} />
            <MercuryBrain selectedRegion={selectedRegion} onRegionClick={setSelectedRegion} isMobile={isMobile} />

            {/* Bloom effect for very subtle metallic glow */}
            <EffectComposer>
              <Bloom
                intensity={0.02}
                luminanceThreshold={0.95}
                luminanceSmoothing={0.99}
                mipmapBlur
              />
            </EffectComposer>
          </Suspense>
        </Canvas>
      </div>

      {/* Progress Dots - only show for hero + regions, not footer */}
      <ProgressDots activeIndex={Math.min(activeIndex, REGION_KEYS.length)} total={REGION_KEYS.length} />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/50 to-transparent pointer-events-none" />
        <nav className="relative flex items-center justify-between pt-6 pb-4 md:pt-8 md:pb-6 px-4 md:px-12">
          <a href="#" className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-11 md:h-11">
              <img src="/logo.png" alt="BrainArts" className="w-full h-full object-contain drop-shadow-lg" />
            </div>
            <div className="flex flex-col">
              <span className="font-bebas text-lg md:text-[1.7rem] tracking-[0.2em] md:tracking-[0.3em] metallic-text-bright">
                BRAINARTS
              </span>
              <span className="font-inter text-[7px] md:text-[10px] tracking-[0.15em] md:tracking-[0.2em] uppercase text-white/40">
                Neural Intelligence
              </span>
            </div>
          </a>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8 lg:gap-10">
            <button onClick={() => setOpenModal("features")} className="metallic-nav-animated text-sm font-medium tracking-wider">{t.nav.features}</button>
            <button onClick={() => setOpenModal("about")} className="metallic-nav-animated text-sm font-medium tracking-wider">{t.nav.about}</button>
            <button onClick={() => setOpenModal("demo")} className="metallic-button-dark px-5 py-2 text-sm font-medium tracking-wider">
              <span className="metallic-text-hero">{t.nav.demo}</span>
            </button>
            {/* Language Toggle */}
            <button
              onClick={() => setLang(lang === "tr" ? "en" : "tr")}
              className="flex items-center gap-1 px-3 py-1.5 rounded bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <span className={`text-xs font-medium ${lang === "tr" ? "text-white" : "text-white/40"}`}>TR</span>
              <span className="text-white/20">|</span>
              <span className={`text-xs font-medium ${lang === "en" ? "text-white" : "text-white/40"}`}>EN</span>
            </button>
          </div>

          {/* Mobile Menu Button & Language */}
          <div className="flex md:hidden items-center gap-3">
            {/* Mobile Language Toggle */}
            <button
              onClick={() => setLang(lang === "tr" ? "en" : "tr")}
              className="flex items-center gap-1 px-2 py-1 rounded bg-white/5 border border-white/10"
            >
              <span className={`text-[10px] font-medium ${lang === "tr" ? "text-white" : "text-white/40"}`}>TR</span>
              <span className="text-white/20">|</span>
              <span className={`text-[10px] font-medium ${lang === "en" ? "text-white" : "text-white/40"}`}>EN</span>
            </button>
            {/* Hamburger Menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded bg-white/5 border border-white/10"
            >
              <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </nav>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-lg border-b border-white/10 px-4 py-4 space-y-3">
            <button onClick={() => { setOpenModal("features"); setMobileMenuOpen(false); }} className="block w-full text-left text-sm text-white/70 py-2">{t.nav.features}</button>
            <button onClick={() => { setOpenModal("about"); setMobileMenuOpen(false); }} className="block w-full text-left text-sm text-white/70 py-2">{t.nav.about}</button>
            <button onClick={() => { setOpenModal("demo"); setMobileMenuOpen(false); }} className="block w-full text-center metallic-button-dark px-5 py-2.5 text-sm font-medium tracking-wider">
              <span className="metallic-text-hero">{t.nav.demo}</span>
            </button>
          </div>
        )}
      </header>

      {/* Content */}
      <div className="relative z-20">
        {/* Hero */}
        <section
          ref={el => { sectionsRef.current[0] = el; }}
          className="min-h-screen flex flex-col"
        >
          {/* Hero Content - Left side */}
          <div
            className={`flex-1 flex items-center transition-all duration-700 ${
              activeIndex === 0 ? 'opacity-100' : 'opacity-0'
            } px-4 md:px-12`}
          >
            <div className="max-w-lg bg-black/40 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none rounded-xl p-4 md:p-0">
              {/* ESG Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full bg-white/[0.03] border border-white/10">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-white/40 to-white/20 animate-pulse" />
                <span className="text-[10px] tracking-[0.25em] uppercase text-white/50">
                  {t.heroSubtitle}
                </span>
              </div>

              {/* Main Tagline */}
              <h1 className="font-bebas text-4xl md:text-5xl lg:text-6xl tracking-wide mb-4 metallic-text-title-animated">
                {t.heroTagline}
              </h1>

              {/* Description */}
              <p className="font-inter text-sm md:text-base text-white/50 leading-relaxed mb-8 max-w-md">
                {t.heroDescription}
              </p>

            </div>
          </div>

          {/* Scroll hint - Bottom */}
          <div className={`pb-8 text-center transition-all duration-500 ${
            activeIndex === 0 ? 'opacity-100' : 'opacity-0'
          }`}>
            <div className="animate-bounce">
              <p className="font-inter text-xs tracking-[0.25em] uppercase mb-2 metallic-text">
                {t.scrollHint}
              </p>
              <svg className="w-5 h-5 mx-auto text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
        </section>

        {/* Region Sections */}
        {REGION_KEYS.map((region, index) => {
          const regionText = t.regions[region];
          const isActive = selectedRegion === region;

          return (
            <section
              key={region}
              ref={el => { sectionsRef.current[index + 1] = el; }}
              className="min-h-screen flex flex-col md:flex-row items-center justify-center md:justify-between px-4 md:px-10 py-8 md:py-0"
            >
              {/* Left - Function Card */}
              <div
                className={`w-full md:w-auto max-w-sm md:max-w-md transition-all duration-700 ease-out mb-4 md:mb-0 ${
                  isActive
                    ? 'opacity-100 translate-y-0 md:translate-x-0'
                    : 'opacity-0 -translate-y-4 md:-translate-y-0 md:-translate-x-12'
                }`}
              >
                <div className={`relative p-4 md:p-8 rounded-2xl transition-all duration-500 ${
                  isActive ? 'bg-black/70 md:bg-white/[0.03] backdrop-blur-lg md:backdrop-blur-md border border-white/10' : ''
                }`}>
                  {/* Number */}
                  <span className={`font-bebas text-5xl md:text-8xl block mb-[-1rem] md:mb-[-1.5rem] transition-all duration-700 ${
                    isActive ? 'metallic-number-animated' : 'text-white/5'
                  }`}>
                    0{index + 1}
                  </span>

                  {/* Subtitle */}
                  <p className={`font-inter text-[10px] md:text-xs tracking-[0.25em] uppercase mb-2 transition-all duration-700 ${
                    isActive ? 'text-white/50' : 'text-white/20'
                  }`}>
                    {regionText.subtitle}
                  </p>

                  {/* Title */}
                  <h2 className={`font-bebas text-2xl md:text-4xl lg:text-5xl tracking-wide mb-2 md:mb-3 transition-all duration-700 ${
                    isActive ? 'metallic-text-title-animated' : 'text-white/30'
                  }`}>
                    {regionText.name}
                  </h2>

                  {/* Function */}
                  <p className={`font-inter text-[11px] md:text-sm font-medium tracking-wide mb-2 md:mb-3 transition-all duration-700 ${
                    isActive ? 'metallic-text' : 'text-white/20'
                  }`}>
                    {regionText.function}
                  </p>

                  {/* Divider */}
                  <div className={`h-px mb-3 md:mb-4 transition-all duration-700 overflow-hidden ${
                    isActive ? 'w-12 md:w-16' : 'w-8 md:w-10 bg-white/10'
                  }`}>
                    {isActive && <div className="h-full w-full metallic-line-animated" />}
                  </div>

                  {/* Description */}
                  <p className={`font-inter text-[11px] md:text-sm leading-relaxed transition-all duration-700 ${
                    isActive ? 'text-white/50' : 'text-white/15'
                  }`}>
                    {regionText.description}
                  </p>
                </div>
              </div>

              {/* Right - Punchline (bottom on mobile) */}
              <div
                className={`w-full md:w-auto max-w-xs md:max-w-sm text-center md:text-right transition-all duration-1000 ease-out ${
                  isActive
                    ? 'opacity-100 translate-y-0 md:translate-x-0'
                    : 'opacity-0 translate-y-4 md:translate-y-0 md:translate-x-12'
                }`}
              >
                <div className={`${isActive ? 'bg-black/60 md:bg-transparent backdrop-blur-md md:backdrop-blur-none p-3 md:p-0 rounded-xl md:rounded-none' : ''}`}>
                  <p className={`font-inter text-sm md:text-xl lg:text-2xl leading-relaxed transition-all duration-700 ${
                    isActive ? 'metallic-text-punchline' : 'text-white/10'
                  }`}>
                    {regionText.punchline}
                  </p>
                </div>
              </div>
            </section>
          );
        })}

        {/* Footer */}
        <section
          ref={el => { sectionsRef.current[REGION_KEYS.length + 1] = el; }}
          className="min-h-[80vh] flex flex-col justify-end pb-8 md:pb-12 px-4 md:px-10"
        >
          {/* Main CTA */}
          <div className={`text-center mb-6 md:mb-8 transition-all duration-700 ${
            activeIndex === REGION_KEYS.length + 1
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-8'
          }`}>
            {/* Title */}
            <h2 className="font-bebas text-3xl md:text-5xl metallic-text-title-animated tracking-wide mb-3 md:mb-4">
              {t.footerTitle}
            </h2>

            {/* Subtitle */}
            <p className="font-inter text-white/35 text-xs md:text-sm mb-5 md:mb-6 max-w-xs md:max-w-md mx-auto px-4 md:px-0">
              {t.footerSubtitle}
            </p>

            {/* Button */}
            <button onClick={() => setOpenModal("demo")} className="metallic-button-dark px-8 md:px-10 py-3 md:py-3.5 text-sm md:text-base font-medium tracking-wider">
              <span className="metallic-text-hero">{t.nav.demo}</span>
            </button>
          </div>

          {/* Bottom Bar - Copyright left, Social Icons right */}
          <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-4 md:gap-0 mb-4">
            {/* Copyright - Left */}
            <p className="font-inter text-[10px] md:text-[11px] text-white/25 tracking-wider">
              {t.copyright}
            </p>

            {/* Social Icons - Right */}
            <div className="flex items-center gap-3 md:gap-4">
              {/* X/Twitter */}
              <a
                href="https://x.com/BrainArts_"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon-metallic group"
              >
                <svg className="w-5 h-5 icon-silver-shimmer" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              {/* LinkedIn */}
              <a
                href="https://www.linkedin.com/company/brainarts"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon-metallic group"
              >
                <svg className="w-5 h-5 icon-silver-shimmer" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              {/* GitHub */}
              <a
                href="https://github.com/brhmkrs"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon-metallic group"
              >
                <svg className="w-5 h-5 icon-silver-shimmer" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* Modals */}
      <Modal isOpen={openModal === "features"} onClose={() => setOpenModal(null)} title={t.featuresModal.title}>
        <FeaturesContent t={t} />
      </Modal>

      <Modal isOpen={openModal === "about"} onClose={() => setOpenModal(null)} title={t.aboutModal.title}>
        <AboutContent t={t} />
      </Modal>

      <Modal isOpen={openModal === "demo"} onClose={() => setOpenModal(null)} title={t.demoModal.title}>
        <DemoContent t={t} onClose={() => setOpenModal(null)} />
      </Modal>

      {/* Metallic Styles */}
      <style jsx global>{`
        /* Base metallic text - bright version for headers */
        .metallic-text-bright {
          background: linear-gradient(
            180deg,
            #ffffff 0%,
            #e0e0e0 20%,
            #ffffff 40%,
            #c0c0c0 60%,
            #ffffff 80%,
            #e0e0e0 100%
          );
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
        }

        /* Base metallic text */
        .metallic-text {
          background: linear-gradient(
            180deg,
            #e8e8e8 0%,
            #ffffff 15%,
            #a0a0a0 30%,
            #ffffff 50%,
            #909090 70%,
            #ffffff 85%,
            #c0c0c0 100%
          );
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        }

        /* Hero metallic - animated shine (slow) */
        .metallic-text-hero {
          background: linear-gradient(
            90deg,
            #505050 0%,
            #808080 15%,
            #c0c0c0 30%,
            #ffffff 50%,
            #c0c0c0 70%,
            #808080 85%,
            #505050 100%
          );
          background-size: 300% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: slow-shimmer 18s ease-in-out infinite;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4));
        }

        /* Footer metallic - very slow elegant shine */
        .metallic-text-footer {
          background: linear-gradient(
            90deg,
            #707070 0%,
            #909090 15%,
            #c0c0c0 30%,
            #ffffff 50%,
            #c0c0c0 70%,
            #909090 85%,
            #707070 100%
          );
          background-size: 300% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: slow-shimmer 16s ease-in-out infinite;
          filter: drop-shadow(0 2px 6px rgba(255,255,255,0.15));
        }

        /* Title metallic - static but shiny */
        .metallic-text-title {
          background: linear-gradient(
            135deg,
            #909090 0%,
            #f0f0f0 25%,
            #ffffff 50%,
            #d0d0d0 75%,
            #909090 100%
          );
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 2px 6px rgba(255,255,255,0.1));
        }

        /* Title metallic - with very slow shimmer */
        .metallic-text-title-animated {
          background: linear-gradient(
            90deg,
            #707070 0%,
            #909090 15%,
            #c0c0c0 30%,
            #ffffff 50%,
            #c0c0c0 70%,
            #909090 85%,
            #707070 100%
          );
          background-size: 300% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: slow-shimmer 8s ease-in-out infinite;
          filter: drop-shadow(0 2px 6px rgba(255,255,255,0.1));
        }

        @keyframes slow-shimmer {
          0%, 100% { background-position: 100% center; }
          50% { background-position: 0% center; }
        }

        /* Punchline metallic - elegant shimmer for quotes */
        .metallic-text-punchline {
          background: linear-gradient(
            90deg,
            #606060 0%,
            #808080 15%,
            #b0b0b0 30%,
            #e0e0e0 50%,
            #b0b0b0 70%,
            #808080 85%,
            #606060 100%
          );
          background-size: 300% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: slow-shimmer 10s ease-in-out infinite;
          filter: drop-shadow(0 2px 8px rgba(255,255,255,0.05));
        }

        /* Number metallic - with slow shimmer, low opacity */
        .metallic-number-animated {
          background: linear-gradient(
            90deg,
            #404040 0%,
            #606060 20%,
            #909090 40%,
            #c0c0c0 50%,
            #909090 60%,
            #606060 80%,
            #404040 100%
          );
          background-size: 300% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: slow-shimmer 12s ease-in-out infinite;
          opacity: 0.4;
        }

        @keyframes metallic-shine {
          0%, 100% { background-position: 200% center; }
          50% { background-position: -200% center; }
        }

        /* Metallic line - static */
        .metallic-line {
          background: linear-gradient(
            90deg,
            transparent 0%,
            #606060 10%,
            #ffffff 50%,
            #606060 90%,
            transparent 100%
          );
        }

        /* Metallic line - with traveling light */
        .metallic-line-animated {
          background: linear-gradient(
            90deg,
            #303030 0%,
            #505050 20%,
            #707070 40%,
            #ffffff 50%,
            #707070 60%,
            #505050 80%,
            #303030 100%
          );
          background-size: 200% 100%;
          animation: line-travel 6s ease-in-out infinite;
        }

        @keyframes line-travel {
          0% { background-position: 100% center; }
          100% { background-position: -100% center; }
        }

        /* Metallic vertical line - slow shimmer */
        .metallic-line-vertical {
          background: linear-gradient(
            180deg,
            #707070 0%,
            #a0a0a0 25%,
            #d0d0d0 50%,
            #a0a0a0 75%,
            #505050 100%
          );
          background-size: 100% 300%;
          animation: vertical-shimmer 8s ease-in-out infinite;
        }

        @keyframes vertical-shimmer {
          0%, 100% { background-position: center 100%; }
          50% { background-position: center 0%; }
        }

        /* Metallic button - light version */
        .metallic-button {
          background: linear-gradient(
            180deg,
            #e0e0e0 0%,
            #ffffff 20%,
            #c0c0c0 50%,
            #909090 80%,
            #707070 100%
          );
          color: #1a1a1a;
          font-weight: 500;
          border: 1px solid rgba(255,255,255,0.3);
          border-radius: 2px;
          transition: all 0.3s ease;
          box-shadow:
            0 2px 4px rgba(0,0,0,0.3),
            inset 0 1px 0 rgba(255,255,255,0.5);
        }

        .metallic-button:hover {
          background: linear-gradient(
            180deg,
            #ffffff 0%,
            #f0f0f0 20%,
            #d0d0d0 50%,
            #a0a0a0 80%,
            #808080 100%
          );
          transform: translateY(-1px);
          box-shadow:
            0 4px 8px rgba(0,0,0,0.4),
            inset 0 1px 0 rgba(255,255,255,0.6);
        }

        /* Metallic button - dark version with animated text */
        .metallic-button-dark {
          background: rgba(10, 10, 10, 0.8);
          border: 1px solid;
          border-image: linear-gradient(
            135deg,
            #404040 0%,
            #808080 25%,
            #c0c0c0 50%,
            #808080 75%,
            #404040 100%
          ) 1;
          border-radius: 0;
          transition: all 0.3s ease;
          box-shadow:
            0 0 20px rgba(128, 128, 128, 0.1),
            inset 0 0 20px rgba(0, 0, 0, 0.5);
        }

        .metallic-button-dark:hover {
          background: rgba(20, 20, 20, 0.9);
          border-image: linear-gradient(
            135deg,
            #606060 0%,
            #a0a0a0 25%,
            #e0e0e0 50%,
            #a0a0a0 75%,
            #606060 100%
          ) 1;
          box-shadow:
            0 0 30px rgba(128, 128, 128, 0.2),
            inset 0 0 20px rgba(0, 0, 0, 0.3);
          transform: translateY(-2px);
        }

        /* Metallic icon (for SVGs) */
        .metallic-icon {
          stroke: url(#metallic-gradient);
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
          stroke: #a0a0a0;
        }

        /* Metallic subtle (for small text/subtitles) */
        .metallic-text-subtle {
          background: linear-gradient(
            180deg,
            #505050 0%,
            #707070 40%,
            #909090 50%,
            #707070 60%,
            #505050 100%
          );
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Metallic nav links - bright version */
        .metallic-nav-bright {
          background: linear-gradient(
            180deg,
            #a0a0a0 0%,
            #d0d0d0 30%,
            #ffffff 50%,
            #d0d0d0 70%,
            #a0a0a0 100%
          );
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          transition: all 0.3s ease;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
        }

        .metallic-nav-bright:hover {
          background: linear-gradient(
            180deg,
            #d0d0d0 0%,
            #f0f0f0 30%,
            #ffffff 50%,
            #f0f0f0 70%,
            #d0d0d0 100%
          );
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 2px 6px rgba(255,255,255,0.3));
        }

        /* Metallic nav links - animated shimmer */
        .metallic-nav-animated {
          background: linear-gradient(
            90deg,
            #808080 0%,
            #a0a0a0 20%,
            #d0d0d0 40%,
            #ffffff 50%,
            #d0d0d0 60%,
            #a0a0a0 80%,
            #808080 100%
          );
          background-size: 300% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: slow-shimmer 10s ease-in-out infinite;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
          transition: filter 0.3s ease;
        }

        .metallic-nav-animated:hover {
          filter: drop-shadow(0 2px 8px rgba(255,255,255,0.4));
          animation-duration: 3s;
        }

        /* Metallic nav links */
        .metallic-nav {
          background: linear-gradient(
            180deg,
            #707070 0%,
            #a0a0a0 30%,
            #d0d0d0 50%,
            #a0a0a0 70%,
            #707070 100%
          );
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          transition: all 0.3s ease;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));
        }

        .metallic-nav:hover {
          background: linear-gradient(
            180deg,
            #c0c0c0 0%,
            #e0e0e0 30%,
            #ffffff 50%,
            #e0e0e0 70%,
            #c0c0c0 100%
          );
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 2px 4px rgba(255,255,255,0.2));
        }

        /* Font classes */
        .font-bebas {
          font-family: var(--font-bebas), sans-serif;
        }

        .font-inter {
          font-family: var(--font-inter), sans-serif;
        }

        html {
          scroll-behavior: smooth;
        }

        /* Social icon with silver shimmer */
        .social-icon-metallic {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(180, 180, 180, 0.15);
          transition: all 0.4s ease;
          animation: icon-border-silver 10s ease-in-out infinite;
        }

        .social-icon-metallic svg {
          transition: all 0.4s ease;
        }

        /* SVG with metallic gradient fill */
        .social-icon-metallic svg path {
          fill: url(#silver-gradient);
        }

        .social-icon-metallic:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(220, 220, 220, 0.3);
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
        }

        .social-icon-metallic:hover svg path {
          fill: url(#silver-gradient-bright);
        }

        @keyframes icon-border-silver {
          0%, 100% { border-color: rgba(140, 140, 140, 0.15); }
          50% { border-color: rgba(200, 200, 200, 0.3); }
        }

        /* Silver shimmer effect for icons */
        .icon-silver-shimmer path {
          fill: #707070;
          animation: silver-icon-shimmer 10s ease-in-out infinite;
        }

        .social-icon-metallic:hover .icon-silver-shimmer path {
          fill: #d0d0d0;
          filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.4));
        }

        @keyframes silver-icon-shimmer {
          0%, 100% { fill: #606060; }
          25% { fill: #808080; }
          50% { fill: #a8a8a8; }
          75% { fill: #808080; }
        }

        /* Executional keyword - bright metallic shimmer */
        .executional-shimmer {
          background: linear-gradient(
            90deg,
            #909090 0%,
            #c0c0c0 15%,
            #e8e8e8 30%,
            #ffffff 50%,
            #e8e8e8 70%,
            #c0c0c0 85%,
            #909090 100%
          );
          background-size: 300% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-weight: 600;
          animation: slow-shimmer 12s ease-in-out infinite;
          filter: drop-shadow(0 2px 8px rgba(255,255,255,0.2));
        }

        /* Bold highlight text - metallic */
        .metallic-bold {
          background: linear-gradient(
            90deg,
            #a0a0a0 0%,
            #d0d0d0 25%,
            #ffffff 50%,
            #d0d0d0 75%,
            #a0a0a0 100%
          );
          background-size: 300% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-weight: 600;
          animation: slow-shimmer 14s ease-in-out infinite;
        }

        /* Scrollbar styling for modals */
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }
        .overflow-y-auto::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 3px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}

useGLTF.preload(BRAIN_MODEL);
