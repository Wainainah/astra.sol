"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { BlockiesAvatar } from "@/components/ui/blockies-avatar";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface AvatarUploadProps {
  currentAvatar?: string;
  walletAddress: string;
  onUpload: (url: string) => void;
}

export function AvatarUpload({
  currentAvatar,
  walletAddress,
  onUpload,
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentAvatar);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB");
      return;
    }

    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Upload
    setIsUploading(true);
    try {
      // Get presigned URL
      const presignedResponse = await fetch("/api/upload/presigned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          folder: "avatars",
        }),
      });

      if (!presignedResponse.ok) {
        throw new Error("Failed to get upload URL");
      }

      const { presignedUrl, publicUrl } = await presignedResponse.json();

      // Upload to R2
      const uploadResponse = await fetch(presignedUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image");
      }

      onUpload(publicUrl);
      toast.success("Avatar uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload avatar", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
      // Reset preview on error
      setPreviewUrl(currentAvatar);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(undefined);
    onUpload("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        {previewUrl ? (
          <div className="relative">
            <Image
              src={previewUrl}
              alt="Avatar preview"
              width={100}
              height={100}
              className="rounded-full object-cover"
            />
            {!isUploading && (
              <button
                onClick={handleRemove}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ) : (
          <BlockiesAvatar address={walletAddress} size={100} />
        )}

        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
      >
        <Upload className="h-4 w-4 mr-2" />
        {previewUrl ? "Change Avatar" : "Upload Avatar"}
      </Button>

      <p className="text-xs text-muted-foreground">Max 2MB, JPG/PNG/WebP</p>
    </div>
  );
}
