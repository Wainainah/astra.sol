"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, X, AlertCircle, Crop } from "lucide-react";
import { ImageCropper } from "./ImageCropper";

interface ImageUploadProps {
  value: File | null;
  onChange: (file: File | null) => void;
  error?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function ImageUpload({ value, onChange, error }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [isSquare, setIsSquare] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if image is square
  const checkIfSquare = useCallback((src: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const ratio = img.width / img.height;
        resolve(ratio >= 0.95 && ratio <= 1.05); // Allow 5% tolerance
      };
      img.onerror = () => resolve(true); // Assume square on error
      img.src = src;
    });
  }, []);

  const processFile = useCallback(
    async (file: File) => {
      setUploadError(null);

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setUploadError("Image must be under 5MB");
        return;
      }

      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        setUploadError("Only JPG, PNG, WEBP, and GIF files allowed");
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = async () => {
        const dataUrl = reader.result as string;
        const square = await checkIfSquare(dataUrl);
        setIsSquare(square);

        if (!square) {
          // Show cropper for non-square images
          setCropSource(dataUrl);
          setShowCropper(true);
        } else {
          // Square image - use directly
          setPreview(dataUrl);
          onChange(file);
        }
      };
      reader.readAsDataURL(file);
    },
    [onChange, checkIfSquare],
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
  };

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  // Handle crop complete
  const handleCropComplete = useCallback(
    (croppedFile: File) => {
      setShowCropper(false);
      setCropSource(null);
      setIsSquare(true);

      // Create preview from cropped file
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(croppedFile);

      onChange(croppedFile);
    },
    [onChange],
  );

  const handleCropCancel = useCallback(() => {
    setShowCropper(false);
    setCropSource(null);
  }, []);

  const handleRemove = () => {
    setPreview(null);
    setIsSquare(true);
    onChange(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  // Re-crop existing image
  const handleReCrop = () => {
    if (preview) {
      setCropSource(preview);
      setShowCropper(true);
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Upload token image"
      />

      {preview || value ? (
        <div className="relative">
          <Card className="relative aspect-square overflow-hidden">
            <Image
              src={preview || URL.createObjectURL(value!)}
              alt="Token preview"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 400px"
            />
            {/* Square indicator */}
            <Badge
              variant="secondary"
              className="absolute bottom-2 left-2 bg-black/60 text-white"
            >
              1:1
            </Badge>
          </Card>
          <div className="absolute -top-2 -right-2 flex gap-1">
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={handleReCrop}
              type="button"
              title="Re-crop image"
            >
              <Crop className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={handleRemove}
              type="button"
              title="Remove image"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <Card
          className={`aspect-square flex flex-col items-center justify-center cursor-pointer transition-colors border-dashed border-2 ${
            isDragging ? "border-primary bg-primary/10" : "hover:bg-muted/50"
          }`}
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload
            className={`h-12 w-12 mb-4 ${isDragging ? "text-primary" : "text-muted-foreground"}`}
          />
          <p
            className={`text-sm font-medium ${isDragging ? "text-primary" : "text-muted-foreground"}`}
          >
            {isDragging ? "Drop image here" : "Click or drag to upload"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            JPG, PNG, WEBP, GIF (max 5MB)
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Non-square images will be cropped
          </p>
        </Card>
      )}

      {(error || uploadError) && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error || uploadError}</span>
        </div>
      )}

      {/* Image Cropper Dialog */}
      {cropSource && (
        <ImageCropper
          imageSrc={cropSource}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          open={showCropper}
        />
      )}
    </div>
  );
}
