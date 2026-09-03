// URL de la foto de un ejercicio del catálogo. Módulo minúsculo: seguro de importar
// desde cualquier sitio (no arrastra catalog.json).

export function catalogImageUrl(id: string): string {
  return `${import.meta.env.BASE_URL}exercises/${id}.webp`;
}
