"use client";

import { useState } from "react";

// Demo page showing different card/info display alternatives
export default function DemoPage() {
  const [activeStyle, setActiveStyle] = useState(1);

  return (
    <div className="min-h-screen bg-[#030303] text-white p-8">
      <h1 className="text-3xl font-bold mb-8 metallic-text">Kart Alternatifleri Demo</h1>

      {/* Style selector */}
      <div className="flex gap-4 mb-12 flex-wrap">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => setActiveStyle(n)}
            className={`px-4 py-2 rounded transition-all ${
              activeStyle === n
                ? 'metallic-button'
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            Stil {n}
          </button>
        ))}
      </div>

      {/* Demo area with fake brain placeholder */}
      <div className="relative h-[600px] bg-white/5 rounded-2xl overflow-hidden">
        {/* Fake brain placeholder */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-64 h-64 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 opacity-30" />
          <p className="absolute text-white/20 text-sm">[ Beyin Burada ]</p>
        </div>

        {/* Style 1: Minimal HUD */}
        {activeStyle === 1 && (
          <div className="absolute right-8 top-1/2 -translate-y-1/2">
            <div className="border-l-2 border-white/30 pl-4 py-2">
              <p className="text-[10px] tracking-[0.3em] uppercase text-white/40 mb-1">01 — Karar Merkezi</p>
              <h3 className="text-2xl font-bold metallic-text mb-2">FRONTAL LOB</h3>
              <p className="text-xs text-white/30 max-w-[200px]">
                Karar verme, planlama ve problem çözme merkezi.
              </p>
            </div>
          </div>
        )}

        {/* Style 2: Bottom Panel */}
        {activeStyle === 2 && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-8">
            <div className="max-w-4xl mx-auto flex items-end justify-between">
              <div>
                <p className="text-[10px] tracking-[0.3em] uppercase text-white/40 mb-2">01 — Karar Merkezi</p>
                <h3 className="text-4xl font-bold metallic-text">FRONTAL LOB</h3>
              </div>
              <p className="text-sm text-white/40 max-w-md text-right">
                Karar verme, planlama ve problem çözme. Kişiliğinizin ve iradenizin merkezi.
              </p>
            </div>
          </div>
        )}

        {/* Style 3: Terminal/HUD */}
        {activeStyle === 3 && (
          <div className="absolute right-8 top-1/2 -translate-y-1/2 font-mono">
            <div className="bg-black/60 border border-white/20 p-4 rounded">
              <div className="text-[10px] text-green-400/60 mb-2">/// BRAIN.REGION.SCAN</div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-white/40">[</span>
                <span className="text-xl metallic-text">FRONTAL LOB</span>
                <span className="text-white/40">]</span>
              </div>
              <div className="text-[10px] text-white/30 space-y-1">
                <p>├─ TYPE: Karar Merkezi</p>
                <p>├─ FUNC: Planlama, Problem Çözme</p>
                <p>└─ STATUS: <span className="text-green-400">ACTIVE</span></p>
              </div>
            </div>
          </div>
        )}

        {/* Style 4: Floating Minimal */}
        {activeStyle === 4 && (
          <div className="absolute right-12 top-1/3">
            <div className="relative">
              {/* Connecting line */}
              <div className="absolute -left-20 top-1/2 w-16 h-px bg-gradient-to-r from-transparent to-white/30" />
              {/* Dot */}
              <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/50" />
              {/* Text */}
              <div className="pl-2">
                <h3 className="text-lg metallic-text">Frontal Lob</h3>
                <p className="text-[10px] text-white/30">Karar Merkezi</p>
              </div>
            </div>
          </div>
        )}

        {/* Style 5: Side Rail Timeline */}
        {activeStyle === 5 && (
          <div className="absolute right-8 top-1/2 -translate-y-1/2">
            <div className="flex gap-4">
              {/* Timeline */}
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-white/60 ring-4 ring-white/20" />
                <div className="w-px h-12 bg-white/20" />
                <div className="w-2 h-2 rounded-full bg-white/20" />
                <div className="w-px h-12 bg-white/20" />
                <div className="w-2 h-2 rounded-full bg-white/20" />
                <div className="w-px h-12 bg-white/20" />
                <div className="w-2 h-2 rounded-full bg-white/20" />
                <div className="w-px h-12 bg-white/20" />
                <div className="w-2 h-2 rounded-full bg-white/20" />
              </div>
              {/* Content */}
              <div className="pt-0">
                <p className="text-[10px] tracking-[0.2em] uppercase text-white/40 mb-1">01</p>
                <h3 className="text-xl metallic-text mb-1">Frontal Lob</h3>
                <p className="text-xs text-white/30 max-w-[180px]">
                  Karar verme ve planlama merkezi.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Style descriptions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
        <div className={`p-4 rounded ${activeStyle === 1 ? 'bg-white/10' : 'bg-white/5'}`}>
          <h4 className="font-bold mb-2">1. Minimal HUD</h4>
          <p className="text-white/50 text-xs">Sol kenarda ince çizgi ile minimal bilgi</p>
        </div>
        <div className={`p-4 rounded ${activeStyle === 2 ? 'bg-white/10' : 'bg-white/5'}`}>
          <h4 className="font-bold mb-2">2. Bottom Panel</h4>
          <p className="text-white/50 text-xs">Alt kısımda gradient panel</p>
        </div>
        <div className={`p-4 rounded ${activeStyle === 3 ? 'bg-white/10' : 'bg-white/5'}`}>
          <h4 className="font-bold mb-2">3. Terminal/HUD</h4>
          <p className="text-white/50 text-xs">Futuristik terminal görünümü</p>
        </div>
        <div className={`p-4 rounded ${activeStyle === 4 ? 'bg-white/10' : 'bg-white/5'}`}>
          <h4 className="font-bold mb-2">4. Floating Minimal</h4>
          <p className="text-white/50 text-xs">Çizgiyle bağlı minimal etiket</p>
        </div>
        <div className={`p-4 rounded ${activeStyle === 5 ? 'bg-white/10' : 'bg-white/5'}`}>
          <h4 className="font-bold mb-2">5. Side Timeline</h4>
          <p className="text-white/50 text-xs">Dikey timeline ile bölümler</p>
        </div>
      </div>

      {/* Styles */}
      <style jsx global>{`
        .metallic-text {
          background: linear-gradient(180deg, #e8e8e8 0%, #ffffff 15%, #a0a0a0 30%, #ffffff 50%, #909090 70%, #ffffff 85%, #c0c0c0 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .metallic-button {
          background: linear-gradient(180deg, #e0e0e0 0%, #ffffff 20%, #c0c0c0 50%, #909090 80%, #707070 100%);
          color: #1a1a1a;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
