
'use client';

import { UploadCloud } from 'lucide-react';
import { useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';

interface DropzoneProps extends React.HTMLAttributes<HTMLDivElement> {}

const baseStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px',
  borderWidth: 2,
  borderRadius: 'var(--radius)',
  borderColor: 'hsl(var(--border))',
  borderStyle: 'dashed',
  backgroundColor: 'hsl(var(--background))',
  color: 'hsl(var(--muted-foreground))',
  outline: 'none',
  transition: 'border .24s ease-in-out',
  cursor: 'pointer'
};

const focusedStyle: React.CSSProperties = {
  borderColor: 'hsl(var(--primary))',
};

const acceptStyle: React.CSSProperties = {
  borderColor: 'hsl(var(--accent))',
};

const rejectStyle: React.CSSProperties = {
  borderColor: 'hsl(var(--destructive))',
};


export function Dropzone({ className }: DropzoneProps) {
  const {
    getRootProps,
    getInputProps,
    isFocused,
    isDragAccept,
    isDragReject,
  } = useDropzone({ accept: { 'video/*': [] }, disabled: true }); // Disabled for now

  const style = useMemo(
    () => ({
      ...baseStyle,
      ...(isFocused ? focusedStyle : {}),
      ...(isDragAccept ? acceptStyle : {}),
      ...(isDragReject ? rejectStyle : {}),
    }),
    [isFocused, isDragAccept, isDragReject]
  );

  return (
    <div className={cn("container", className)}>
      <div {...getRootProps({ style } as any)}>
        <input {...getInputProps()} />
        <UploadCloud className="h-10 w-10 mb-4 text-primary" />
        <p className="text-center">Drag 'n' drop a video file here, or click to select a file</p>
        <em className="text-sm">(This feature is not functional yet)</em>
      </div>
    </div>
  );
}

    