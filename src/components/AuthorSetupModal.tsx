"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  open: boolean;
  onSave: (name: string) => void;
}

export function AuthorSetupModal({ open, onSave }: Props) {
  const [name, setName] = useState("");

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-xs" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>名前を入力してください</DialogTitle>
          <DialogDescription>
            記録の著者名として使用されます。後から変更できます。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="author-name">著者名</Label>
          <Input
            id="author-name"
            type="text"
            placeholder="例: 荒木"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && name.trim() && onSave(name.trim())}
            autoFocus
          />
        </div>
        <Button
          className="w-full"
          onClick={() => name.trim() && onSave(name.trim())}
          disabled={!name.trim()}
        >
          はじめる
        </Button>
      </DialogContent>
    </Dialog>
  );
}
