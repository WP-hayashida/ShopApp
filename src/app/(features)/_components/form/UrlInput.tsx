import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface UrlInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const UrlInput = ({ value, onChange }: UrlInputProps) => (
  <div className="space-y-2">
    <Label htmlFor="url">URL</Label>
    <Input
      id="url"
      type="url"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="https://example.com"
    />
  </div>
);