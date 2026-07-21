"use client";

import { useState } from "react";

// Photo gallery: one large image + selectable thumbnails (TZ §2.1).
export default function Gallery({
  photos,
  alt,
}: {
  photos: string[];
  alt: string;
}) {
  const [active, setActive] = useState(0);

  if (photos.length === 0) {
    return (
      <div className="gallery">
        <div className="main" aria-label="No photos available" />
      </div>
    );
  }

  return (
    <div className="gallery">
      <div className="main">
        <img src={photos[active]} alt={`${alt} — photo ${active + 1}`} />
      </div>
      {photos.length > 1 && (
        <div className="thumbs" role="tablist" aria-label="Photos">
          {photos.map((src, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === active}
              aria-label={`Show photo ${i + 1}`}
              className={i === active ? "active" : ""}
              onClick={() => setActive(i)}
            >
              <img src={src} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
