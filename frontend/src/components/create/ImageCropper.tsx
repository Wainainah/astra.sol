"use client";

import { useState, useRef, useCallback } from "react";
import ReactCrop, {
  Crop,
  PixelCrop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedFile: File) => void;
  onCancel: () => void;
  open: boolean;
}

// Helper to create a centered square crop
function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
): Crop {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

// Helper to get cropped image as File
async function getCroppedImg(
  image: HTMLImageElement,
  crop: PixelCrop,
  fileName: string,
): Promise<File> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  // Set output size to 400x400 for token images
  const outputSize = 400;
  canvas.width = outputSize;
  canvas.height = outputSize;

  // Draw the cropped image
  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    outputSize,
    outputSize,
  );

  // Convert to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        const file = new File([blob], fileName, { type: "image/png" });
        resolve(file);
      },
      "image/png",
      1,
    );
  });
}

export function ImageCropper({
  imageSrc,
  onCropComplete,
  onCancel,
  open,
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isProcessing, setIsProcessing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      const initialCrop = centerAspectCrop(width, height, 1);
      setCrop(initialCrop);
      // Also set completedCrop so we have valid crop data immediately
      setCompletedCrop(initialCrop as PixelCrop);
    },
    [],
  );

  const handleCropConfirm = async () => {
    if (!completedCrop || !imgRef.current) {
      console.error("Cannot crop: missing completedCrop or imgRef", {
        completedCrop,
        imgRef: !!imgRef.current,
      });
      return;
    }

    console.log("Cropping with:", {
      x: completedCrop.x,
      y: completedCrop.y,
      width: completedCrop.width,
      height: completedCrop.height,
      imgWidth: imgRef.current.naturalWidth,
      imgHeight: imgRef.current.naturalHeight,
    });

    setIsProcessing(true);
    try {
      const croppedFile = await getCroppedImg(
        imgRef.current,
        completedCrop,
        "token-image.png",
      );
      onCropComplete(croppedFile);
    } catch (err) {
      console.error("Error cropping image:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Crop Image</DialogTitle>
          <DialogDescription>
            Adjust the crop area to create a square image for your token.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center py-4">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={1}
            circularCrop={false}
            className="max-h-[400px]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop preview"
              onLoad={onImageLoad}
              className="max-h-[400px] w-auto"
            />
          </ReactCrop>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleCropConfirm} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Apply Crop"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
