import jsQR from 'jsqr';

/**
 * Decode QR code from image file
 * @param {File} file - Image file
 * @returns {Promise<string>} Decoded QR data
 */
export async function decodeQRFromImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          // Create canvas to extract image data
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          // Get image data
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          // Decode QR code
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });
          
          if (code) {
            resolve(code.data);
          } else {
            reject(new Error('No QR code found in image'));
          }
        } catch (error) {
          reject(new Error(`Failed to decode QR code: ${error.message}`));
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = e.target.result;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Parse QR data (might be JSON or plain CID)
 * @param {string} qrData - Raw QR data
 * @returns {Object} Parsed data with cid and optional publicKey
 */
export function parseQRData(qrData) {
  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(qrData);
    return {
      cid: parsed.cid || parsed.CID || qrData,
      publicKey: parsed.publicKey || parsed.PublicKey || null,
      type: parsed.type || null
    };
  } catch {
    // If not JSON, treat as plain CID
    return {
      cid: qrData.trim(),
      publicKey: null,
      type: null
    };
  }
}

/**
 * Validate image file
 * @param {File} file - File to validate
 * @returns {boolean} True if valid image
 */
export function isValidImageFile(file) {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.');
  }
  
  if (file.size > maxSize) {
    throw new Error('File too large. Maximum size is 10MB.');
  }
  
  return true;
}
