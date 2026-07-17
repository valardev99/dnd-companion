import { useState } from "react";

/**
 * Product image with a graceful fallback — the catalog hotlinks the Shopify
 * CDN, and a dead link should degrade to a monogram tile, not a broken image.
 */
export function JewelryImage({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        aria-label={alt}
        className={`flex items-center justify-center rounded-full bg-gold-gradient text-primary-foreground font-display ${className}`}
      >
        {alt.charAt(0)}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`object-contain ${className}`}
    />
  );
}
