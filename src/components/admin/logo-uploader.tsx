import { useCallback, useRef, useState } from "react";
import { Upload, X, RefreshCw, Loader2, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const ACCEPT = "image/png,image/jpeg,image/jpg,image/webp,image/svg+xml";
const MAX_BYTES = 1024 * 1024; // 1 MB

interface LogoUploaderProps {
  value: string | null;
  onChange: (url: string | null) => void;
  onUploaded?: (url: string) => void;
  disabled?: boolean;
}

/**
 * Compress raster images >500KB through canvas down to ≤1MB.
 * SVGs pass through untouched.
 */
async function compressIfNeeded(file: File): Promise<File> {
  if (file.type === "image/svg+xml" || file.size <= 500 * 1024) return file;
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const max = 1024;
      let { width, height } = img;
      if (width > max || height > max) {
        const scale = Math.min(max / width, max / height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(file);
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) return resolve(file);
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), { type: "image/webp" }));
        },
        "image/webp",
        0.9,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

export function LogoUploader({ value, onChange, onUploaded, disabled }: LogoUploaderProps) {
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(
    async (file: File) => {
      if (!ACCEPT.split(",").includes(file.type)) {
        toast.error("Unsupported file type", {
          description: "Use PNG, JPG, WEBP or SVG.",
        });
        return;
      }
      if (file.size > MAX_BYTES) {
        toast.error("File too large", { description: "Maximum size is 1 MB." });
        return;
      }
      setBusy(true);
      try {
        const processed = await compressIfNeeded(file);
        const ext = (processed.name.split(".").pop() || "png").toLowerCase();
        const path = `platform/logo-${Date.now()}.${ext}`;
        const { error } = await supabase.storage
          .from("brand-assets")
          .upload(path, processed, { cacheControl: "3600", upsert: false, contentType: processed.type });
        if (error) throw error;
        const { data } = supabase.storage.from("brand-assets").getPublicUrl(path);
        onChange(data.publicUrl);
        onUploaded?.(data.publicUrl);
        toast.success("Logo uploaded");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Upload failed";
        toast.error("Upload failed", { description: msg });
      } finally {
        setBusy(false);
      }
    },
    [onChange, onUploaded],
  );

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (disabled) return;
          const f = e.dataTransfer.files?.[0];
          if (f) void upload(f);
        }}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 transition-colors",
          dragOver ? "border-primary bg-primary/5" : "border-border bg-muted/20",
          disabled && "opacity-50",
        )}
      >
        {value ? (
          <div className="flex w-full items-center gap-4">
            <div
              className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border"
              style={{
                backgroundImage:
                  "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
                backgroundSize: "12px 12px",
                backgroundPosition: "0 0, 0 6px, 6px -6px, -6px 0px",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt="Company logo"
                className="absolute inset-0 h-full w-full object-contain p-1"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">Current logo</p>
              <p className="truncate text-xs text-muted-foreground">{value}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => inputRef.current?.click()}
                disabled={busy || disabled}
              >
                <RefreshCw className="mr-2 h-3.5 w-3.5" />
                Replace
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => onChange(null)}
                disabled={busy || disabled}
              >
                <X className="mr-2 h-3.5 w-3.5" />
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImageIcon className="h-6 w-6" />}
            </div>
            <div>
              <p className="text-sm font-medium">Drag & drop your logo here</p>
              <p className="text-xs text-muted-foreground">or</p>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={busy || disabled}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Company Logo
            </Button>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
            e.target.value = "";
          }}
        />
      </div>
      <p className="text-[11px] text-muted-foreground">
        PNG, JPG, WEBP, or SVG · transparent background supported · maximum size: 1 MB
      </p>
    </div>
  );
}
