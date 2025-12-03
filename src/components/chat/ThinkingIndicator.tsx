"use client";

import React from "react";
import { Loader2 } from "lucide-react";

interface ThinkingIndicatorProps {
  message?: string;
}

export function ThinkingIndicator({ message = "Processing" }: ThinkingIndicatorProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span>{message}...</span>
    </div>
  );
}


