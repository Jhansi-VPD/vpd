import React, { useRef } from 'react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  label?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, accept, label = 'Upload File' }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      className="border-2 border-dashed border-zinc-800 hover:border-[#d4af37] rounded-xl p-6 text-center cursor-pointer transition-colors bg-zinc-950/40"
    >
      <input ref={inputRef} type="file" accept={accept} onChange={handleChange} className="hidden" />
      <div className="text-zinc-400 text-sm font-medium">{label}</div>
      <p className="text-xs text-zinc-500 mt-1">Click to select files or drag and drop</p>
    </div>
  );
};

export default FileUpload;

