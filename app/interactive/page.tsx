"use client";

import dynamic from "next/dynamic";

const InteractiveBrain = dynamic(() => import("@/components/InteractiveBrain"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-[#020202] flex items-center justify-center">
      <div className="text-white/50">Beyin yükleniyor...</div>
    </div>
  ),
});

export default function InteractivePage() {
  return <InteractiveBrain />;
}
