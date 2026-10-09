import React, { useRef, useState } from 'react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  label?: string;
  isUploading?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  accept,
  label = 'Upload Document',
  isUploading = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFile = (file: File) => {
    onFileSelect(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
      // reset input value so re-uploading the same file works
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  return (
    <div
      onClick={() => !isUploading && inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all select-none ${
        isDragOver
          ? 'border-[#D4AF37] bg-amber-500/10 scale-[1.01]'
          : isUploading
          ? 'border-amber-500/40 bg-zinc-950/70 cursor-wait'
          : 'border-zinc-800 hover:border-[#D4AF37] bg-zinc-950/40 hover:bg-zinc-900/40'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
        disabled={isUploading}
      />
      <div className="text-3xl mb-2">{isUploading ? '⏳' : '📁'}</div>
      <div className="text-white text-sm font-semibold">{label}</div>
      <p className="text-xs text-zinc-400 mt-1">
        Click to select files or drag and drop any document (PDF, Word, Excel, Images, Code, Archives)
      </p>

      {isUploading && (
        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-amber-400 font-semibold animate-pulse">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>Uploading and encrypting document into vault...</span>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
