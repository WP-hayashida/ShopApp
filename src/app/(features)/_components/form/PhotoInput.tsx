import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import NextImage from "next/image";

interface PhotoInputProps {
  initialImageUrl: string | null;
  photo: File | null;
  onPhotoChange: (file: File | null) => void;
}

export const PhotoInput = ({ initialImageUrl, photo, onPhotoChange }: PhotoInputProps) => (
  <div className="space-y-2">
    <Label htmlFor="photo">写真</Label>
    {initialImageUrl && !photo && (
      <div className="relative w-32 h-32 mb-2">
        <NextImage
          src={initialImageUrl}
          alt="Current Shop Photo"
          fill
          className="object-cover rounded-md"
        />
      </div>
    )}
    <Input
      id="photo"
      type="file"
      onChange={(e) => onPhotoChange(e.target.files ? e.target.files[0] : null)}
      accept="image/*"
    />
  </div>
);