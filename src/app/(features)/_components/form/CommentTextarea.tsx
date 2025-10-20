import React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CommentTextareaProps {
  value: string;
  onChange: (value: string) => void;
}

export const CommentTextarea = ({ value, onChange }: CommentTextareaProps) => (
  <div className="space-y-2">
    <Label htmlFor="comments">コメント</Label>
    <Textarea
      id="comments"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="お店の雰囲気やおすすめメニューなどを記入してください"
    />
  </div>
);