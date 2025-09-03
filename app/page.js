"use client";
import React, { useMemo, useRef, useState } from "react";

const MODEL_ID = "gemini-2.5-flash-image-preview"; // used for display only

// Simple preset library mirroring lib/presets.ts (kept inline for this single-file demo)
const PRESETS = {
  "Studio Background (White)":
    "Replace background with seamless white studio sweep. Soft, shadowless lighting. Preserve garment shape, fabric texture, and true colors. No distortion.",
  "Ghost Mannequin":
    "Remove human/model/mannequin entirely. Preserve realistic inner neck/arm openings and natural drape (ghost mannequin style). Neutral #f6f6f6 background. No warping.",
  "Lifestyle – Boutique Loft":
    "Place garment on a tasteful lifestyle scene: sunlit loft with wooden floor and soft window light. Keep proportions and fabric details intact.",
  "Flatlay (Marble)":
    "Transform into a top-down flatlay on white marble. Neatly arrange the item centered, subtle soft shadows, accurate texture.",
};

export default function Page() {
  const [file, setFile] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  const [showWatermark, setShowWatermark] = useState(true);

  const inputRef = useRef(null);

  const srcUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  const onDrop = (f) => {
    if (!f.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }
    if (f.size > 18 * 1024 * 1024) {
      setError("Image too large. Please keep under 18MB.");
      return;
    }
    setError(null);
    setResultUrl(null);
    setFile(f);
  };

  async function runEdit() {
    if (!file) {
      setError("Upload an image first.");
      return;
    }
    if (!prompt.trim()) {
      setError("Add a prompt or choose a preset.");
      return;
    }
    setLoading(true);
    setError(null);
    setResultUrl(null);

    try {
      const fd = new FormData();
      fd.append("image", file);
      fd.append("prompt", prompt);

      const res = await fetch("/api/edit", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `Request failed (${res.status})`);
      }

      // Server returns { dataUrl: "data:image/png;base64,..." }
      const { dataUrl } = await res.json();
      setResultUrl(dataUrl);
    } catch (e) {
      setError(e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="sticky top-0 z-20 border-b bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-black" />
            <h1 className="text-lg font-semibold">Photostudio.io — Boutique Editor</h1>
          </div>
          <div className="text-xs text-neutral-500">Model: {MODEL_ID}</div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: Upload + Controls */}
        <section className="space-y-4">
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold mb-3">1) Upload your image</h2>
            <div
              className="relative flex h-56 items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-100"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) onDrop(f);
              }}
            >
              {srcUrl ? (
                // Preview uploaded image
                <img
                  src={srcUrl}
                  alt="uploaded"
                  className="h-full w-full object-contain rounded-xl"
                />
              ) : (
                <div className="flex flex-col items-center gap-1 text-neutral-500">
                  <span className="text-sm">Drag & drop or</span>
                  <button
                    className="rounded-full bg-black px-4 py-2 text-white text-sm"
                    onClick={() => inputRef.current?.click()}
                    type="button"
                  >
                    Choose file
                  </button>
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) onDrop(f);
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold mb-3">2) Pick a preset or write your own prompt</h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {Object.entries(PRESETS).map(([name, text]) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setPrompt(text)}
                  className="rounded-full border px-3 py-1 text-xs hover:bg-neutral-50"
                >
                  {name}
                </button>
              ))}
            </div>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your edit… e.g., Replace background with seamless white studio sweep. Preserve fabric texture, no distortion."
              className="h-32 w-full resize-none rounded-xl border p-3 text-sm outline-none focus:ring-2 focus:ring-black/20"
            />

            <div className="mt-3 flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-neutral-600">
                <input
                  type="checkbox"
                  checked={showWatermark}
                  onChange={(e) => setShowWatermark(e.target.checked)}
                />
                Show visible preview watermark (free tier)
              </label>

              <button
                type="button"
                onClick={runEdit}
                disabled={loading}
                className="rounded-xl bg-black px-4 py-2 text-white text-sm disabled:opacity-50"
              >
                {loading ? "Processing…" : "Generate Edited Image"}
              </button>
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>
        </section>

        {/* Right column: Result */}
        <section className="rounded-2xl border bg-white p-4 shadow-sm min-h-[28rem]">
          <h2 className="text-base font-semibold mb-3">3) Preview</h2>
          {!resultUrl ? (
            <div className="h-[24rem] grid place-items-center text-neutral-400 text-sm">
              {loading ? "Editing with Nano Banana…" : "Your edited image will appear here."}
            </div>
          ) : (
            <div className="relative">
              {showWatermark && (
                <div className="pointer-events-none absolute inset-0 grid place-items-center opacity-30">
                  <div className="select-none rotate-[-20deg] text-6xl font-black tracking-widest text-neutral-300">
                    PHOTOSTUDIO.IO PREVIEW
                  </div>
                </div>
              )}
              <img
                src={resultUrl}
                alt="Edited result"
                className="w-full rounded-xl border object-contain"
              />
              <div className="mt-3 flex items-center gap-2">
                <a
                  className="rounded-xl border px-4 py-2 text-sm hover:bg-neutral-50"
                  href={resultUrl}
                  download
                >
                  Download PNG
                </a>
                <button
                  type="button"
                  className="rounded-xl border px-4 py-2 text-sm hover:bg-neutral-50"
                  onClick={() => setResultUrl(null)}
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-10 text-xs text-neutral-500">
        <div className="mt-6">
          ⚖️ All AI-edited images include an invisible SynthID watermark from Google. Please ensure you have rights to any uploaded images. Avoid uploading images of children (not supported in EEA).
        </div>
      </footer>
    </div>
  );
}