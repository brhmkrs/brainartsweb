"use client";

import dynamic from "next/dynamic";

const InteractiveBrain2 = dynamic(() => import("@/components/InteractiveBrain2"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-[#020202] flex items-center justify-center">
      <div className="text-white/50">Hologram beyin yükleniyor...</div>
    </div>
  ),
});

export default function Interactive2Page() {
  return <InteractiveBrain2 />;
}
