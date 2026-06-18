"use client";

import Image from "next/image";

type SafeImageProps = {
  src?: string | null;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
};

function getInitials(text?: string) {
  if (!text) return null;
  const parts = text.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return null;
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function SafeImage({
  src,
  alt,
  width = 40,
  height = 40,
  className = "",
}: SafeImageProps) {
  const initials = getInitials(alt);

  if (!src) {
    return (
      <div
        className={`rounded-md bg-gray-100 flex items-center justify-center overflow-hidden ${className}`}
        style={{ width, height }}
        role={alt ? "img" : "presentation"}
        aria-label={alt ?? undefined}
      >
        {initials ? (
          <span className="text-sm font-medium text-gray-700">{initials}</span>
        ) : null}
      </div>
    );
  }

  // When a valid src exists, render Next.js Image (keeps optimizations)
  return (
    <Image
      src={src}
      alt={alt ?? ""}
      width={width}
      height={height}
      className={className}
    />
  );
}
