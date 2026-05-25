"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface CopyableValueProps {
  label: string;
  value: string;
}

export function CopyableValue({ label, value }: CopyableValueProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`${label} copied to clipboard`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  }

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border bg-muted/30 p-3">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-sm break-all select-all pr-2 text-foreground/90">{value}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 hover:bg-muted"
          onClick={handleCopy}
        >
          {copied ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
        </Button>
      </div>
    </div>
  );
}
