/**
 * PRESOL CRM — Client-side Image Compression Utility
 * Optimiza y redimensiona fotos tomadas con la cámara del celular o subidas desde galería
 * para que no superen los límites de Vercel (4.5MB) y se procesen de inmediato con OpenAI Vision.
 */

export async function compressImageFile(
  file: File, 
  maxDimension: number = 1200, 
  quality: number = 0.82
): Promise<string> {
  // Si el archivo ya es muy pequeño (< 80KB) y es JPEG/PNG, no necesita recompresión agresiva
  // pero lo pasamos por canvas para garantizar compatibilidad con formatos como HEIC
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);

        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (!width || !height) {
          // Fallback a FileReader si no se detectan dimensiones
          fallbackFileReader(file).then(resolve).catch(reject);
          return;
        }

        // Redimensionar proporcionalmente si supera maxDimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          fallbackFileReader(file).then(resolve).catch(reject);
          return;
        }

        // Suavizado de alta calidad
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir siempre a image/jpeg de calidad óptima (~100-250 KB)
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        fallbackFileReader(file).then(resolve).catch(reject);
      };

      img.src = objectUrl;
    } catch (err) {
      fallbackFileReader(file).then(resolve).catch(reject);
    }
  });
}

function fallbackFileReader(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (e) => reject(new Error('No se pudo leer el archivo de imagen'));
    reader.readAsDataURL(file);
  });
}
