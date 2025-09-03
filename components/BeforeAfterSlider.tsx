"use client";
import { useState } from "react";
import Image from "next/image";

export default function BeforeAfterSlider() {
  const [position, setPosition] = useState(50); // percentage

  return (
    <div className="relative w-full max-w-3xl mx-auto overflow-hidden rounded-xl shadow-lg">
      {/* After image (background) */}
      <Image
        src="/after.jpg"
        alt="After AI edit - Studio quality product photo"
        width={1200}
        height={800}
        className="w-full h-auto object-cover"
      />

      {/* Before image (clipped) */}
      <div
        className="absolute top-0 left-0 h-full overflow-hidden"
        style={{ width: `${position}%` }}
      >
        <Image
          src="/before.jpg"
          alt="Before - Raw shop photo"
          width={1200}
          height={800}
          className="w-full h-auto object-cover"
        />
      </div>

      {/* Divider line */}
      <div
        className="absolute top-0 bottom-0"
        style={{ left: `${position}%` }}
      >
        <div className="w-0.5 bg-white/80 h-full shadow"></div>
      </div>

      {/* Labels */}
      <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded text-sm font-medium">
        BEFORE
      </div>
      <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded text-sm font-medium">
        AFTER
      </div>

      {/* Slider handle */}
      <input
        type="range"
        min="0"
        max="100"
        value={position}
        onChange={(e) => setPosition(Number(e.target.value))}
        className="absolute bottom-3 left-1/2 -translate-x-1/2 w-1/2 cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Slide to compare before and after images"
      />
    </div>
  );
}