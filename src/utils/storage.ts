
/**
 * Utilidad para subir archivos directamente a Supabase Storage
 * Bypassing Netlify bandwidth limits.
 */
export const uploadToSupabaseStorage = async (
  file: File | Blob, 
  bucket: string, 
  path: string, 
  config: { apiUrl: string; apiKey: string }
): Promise<string | null> => {
  if (!config.apiUrl || !config.apiKey) return null;

  // Limpiar la URL de Supabase (quitar /rest/v1 si existe)
  const baseUrl = config.apiUrl.replace(/\/rest\/v1\/?$/, '');
  const uploadUrl = `${baseUrl}/storage/v1/object/${bucket}/${path}`;

  try {
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'apikey': config.apiKey,
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': file.type || 'image/jpeg',
        'x-upsert': 'true'
      },
      body: file
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Supabase Storage Error:", error);
      return null;
    }

    // Retornar la URL pública
    // Nota: El bucket debe ser público en Supabase para que esto funcione directamente
    return `${baseUrl}/storage/v1/object/public/${bucket}/${path}`;
  } catch (error) {
    console.error("Upload failed:", error);
    return null;
  }
};

/**
 * Comprime una imagen antes de subirla
 */
export const compressImage = async (file: File, maxWidth = 1200): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Canvas to Blob failed"));
          },
          'image/jpeg',
          0.7 // Calidad 70%
        );
      };
    };
    reader.onerror = (error) => reject(error);
  });
};
