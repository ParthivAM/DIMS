import React, { useState, useRef } from 'react';
import { decodeQRFromImage, parseQRData, isValidImageFile } from '../../utils/qrDecoder';
import '../../styles/walletTheme.css';

/**
 * QRUploadZone - Upload or drag-drop QR image for decoding
 * 
 * @param {Object} props
 * @param {function} props.onSuccess - Callback with decoded data {cid, publicKey}
 * @param {function} props.onError - Callback with error message
 */
export default function QRUploadZone({ onSuccess, onError }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    try {
      setIsProcessing(true);
      
      // Validate file
      isValidImageFile(file);
      
      // Decode QR code
      const qrData = await decodeQRFromImage(file);
      
      // Parse QR data
      const parsed = parseQRData(qrData);
      
      console.log('✅ QR decoded successfully:', parsed);
      onSuccess(parsed);
      
    } catch (error) {
      console.error('❌ QR decode error:', error);
      onError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className={`drag-drop-zone ${isDragging ? 'dragging' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
      aria-label="Upload QR code image"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        aria-label="File input for QR code"
      />

      {isProcessing ? (
        <>
          <div className="drag-drop-icon">
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid #E9ECEF',
              borderTop: '4px solid #5E72E4',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
          </div>
          <p className="drag-drop-text">Decoding QR code...</p>
        </>
      ) : (
        <>
          <div className="drag-drop-icon">📷</div>
          <p className="drag-drop-text">
            <strong>Upload QR Code Image</strong>
          </p>
          <p className="drag-drop-hint">
            Click to browse or drag & drop an image here
          </p>
          <p className="drag-drop-hint" style={{ marginTop: '8px', fontSize: '12px' }}>
            Supports JPEG, PNG, GIF, WebP (max 10MB)
          </p>
        </>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
