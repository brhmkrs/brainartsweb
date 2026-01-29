"use client";

import dynamic from "next/dynamic";

// Client-side only (Three.js)
const ModelViewer = dynamic(() => import("@/components/ModelViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-[#020202] flex items-center justify-center">
      <div className="text-white/50">Modeller yükleniyor...</div>
    </div>
  ),
});

export default function ModelsPage() {
  return <ModelViewer />;
}
