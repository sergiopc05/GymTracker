// Redimensiona el archivo de foto elegido a un dataURL pequeño para guardar en el store.
// WebP si el navegador lo soporta (iOS >= 16.4); si no, JPEG. Nunca PNG.

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      // fallback abajo
    }
  }
  return await new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("no se pudo leer la imagen"));
    };
    img.src = url;
  });
}

export async function resizeImage(file: File, maxEdge = 320): Promise<string> {
  const bmp = await loadBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bmp.width * scale));
  canvas.height = Math.max(1, Math.round(bmp.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas no disponible");
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  if (typeof ImageBitmap !== "undefined" && bmp instanceof ImageBitmap) bmp.close();

  let url = canvas.toDataURL("image/webp", 0.7);
  if (!url.startsWith("data:image/webp")) url = canvas.toDataURL("image/jpeg", 0.7);
  if (url.length > 40_000) {
    const type = url.startsWith("data:image/webp") ? "image/webp" : "image/jpeg";
    url = canvas.toDataURL(type, 0.5);
  }
  return url;
}
