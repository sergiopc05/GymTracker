import { useEffect, useState } from "react";

interface Props {
  /** URL de la foto del catálogo o dataURL de una foto propia. `null` = sin foto. */
  src: string | null;
  alt: string;
  /** Clase base; se le añade `is-empty` en el placeholder. */
  className: string;
}

/** Foto de un ejercicio con placeholder y fallback si la imagen no carga. */
export function ExercisePhoto({ src, alt, className }: Props) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  if (!src || failed) {
    return (
      <div className={`${className} is-empty`} aria-label={alt} role="img">
        #
      </div>
    );
  }
  return (
    <img
      className={className}
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
