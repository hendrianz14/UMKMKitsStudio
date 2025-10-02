"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface OnboardingAnswers {
  usage_type: "personal" | "team";
  purpose: string;
  business_type: string;
  ref_source: "friend" | "search" | "ad" | "other";
  other_note?: string;
}

interface OnboardingModalProps {
  open: boolean;
  defaultValues?: Partial<OnboardingAnswers>;
  onSave: (answers: OnboardingAnswers) => Promise<void>;
  onSkip: () => Promise<void> | void;
}

const USER_TYPES: Array<{ value: OnboardingAnswers["usage_type"]; label: string }> = [
  { value: "personal", label: "Personal" },
  { value: "team", label: "Tim" },
];

const PURPOSE_OPTIONS = [
  { value: "ig", label: "Konten IG/TikTok" },
  { value: "catalog", label: "Katalog Produk" },
  { value: "ads", label: "Iklan" },
  { value: "other", label: "Lainnya" },
];

const BUSINESS_TYPES = [
  "Kuliner",
  "Fashion",
  "Kecantikan",
  "Kerajinan",
  "F&B",
  "Elektronik",
];

const SOURCE_OPTIONS: Array<{ value: OnboardingAnswers["ref_source"]; label: string }> = [
  { value: "friend", label: "Teman" },
  { value: "search", label: "Pencarian (Google, dsb.)" },
  { value: "ad", label: "Iklan" },
  { value: "other", label: "Lainnya" },
];

export function OnboardingModal({ open, defaultValues, onSave, onSkip }: OnboardingModalProps) {
  const [usageType, setUsageType] = useState<OnboardingAnswers["usage_type"]>(
    defaultValues?.usage_type ?? "personal"
  );
  const [purpose, setPurpose] = useState<string>(defaultValues?.purpose ?? "");
  const [industry, setIndustry] = useState<string>(defaultValues?.business_type ?? "");
  const [source, setSource] = useState<OnboardingAnswers["ref_source"] | "">(
    defaultValues?.ref_source ?? ""
  );
  const [otherNote, setOtherNote] = useState<string>(defaultValues?.other_note ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "skipping">("idle");
  const [error, setError] = useState<string | null>(null);

  const isValid = useMemo(() => {
    return Boolean(purpose && industry.trim() && source);
  }, [purpose, industry, source]);

  useEffect(() => {
    if (!open) return;
    const resolvePurpose = (value?: string) => {
      if (!value) return "";
      const match = PURPOSE_OPTIONS.find(
        (option) => option.value === value || option.label.toLowerCase() === value.toLowerCase()
      );
      return match ? match.value : value;
    };

    setUsageType(defaultValues?.usage_type ?? "personal");
    setPurpose(resolvePurpose(defaultValues?.purpose));
    setIndustry(defaultValues?.business_type ?? "");
    setSource(defaultValues?.ref_source ?? "");
    setOtherNote(defaultValues?.other_note ?? "");
    setError(null);
  }, [defaultValues, open]);

  const isSaving = status === "saving";
  const isSkipping = status === "skipping";
  const isBusy = status !== "idle";

  const handleSubmit = async () => {
    if (!isValid) return;
    setStatus("saving");
    setError(null);
    try {
      const trimmedOther = otherNote.trim();
      await onSave({
        usage_type: usageType === "team" ? "team" : "personal",
        purpose,
        business_type: industry.trim(),
        ref_source: source as OnboardingAnswers["ref_source"],
        other_note: trimmedOther ? trimmedOther : undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan jawaban.");
    } finally {
      setStatus("idle");
    }
  };

  const handleSkip = async () => {
    setStatus("skipping");
    setError(null);
    try {
      await onSkip();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui status.");
    } finally {
      setStatus("idle");
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent hideClose className="max-w-2xl space-y-6">
        <DialogHeader>
          <DialogTitle>Kenalan dulu yuk!</DialogTitle>
          <DialogDescription>
            Jawaban kamu membantu kami menyesuaikan rekomendasi template dan otomasi konten.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Tipe pengguna</p>
            <div className="flex gap-3">
              {USER_TYPES.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={usageType === option.value ? "primary" : "secondary"}
                  onClick={() => setUsageType(option.value)}
                  className={cn(
                    "flex-1 border border-border/60",
                    usageType === option.value ? "shadow-glow" : "bg-background/40"
                  )}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Tujuan utama pakai UMKM Kits</p>
            <Select value={purpose} onValueChange={setPurpose}>
              <SelectTrigger className="text-white placeholder:text-muted-foreground">
                <SelectValue placeholder="Pilih tujuan" />
              </SelectTrigger>
              <SelectContent className="text-foreground">
                {PURPOSE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-foreground">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Jenis usaha</p>
            <div>
              <Input
                list="onboarding-business"
                value={industry}
                onChange={(event) => setIndustry(event.target.value)}
                placeholder="Contoh: Kuliner"
                className="text-white placeholder:text-muted-foreground"
              />
              <datalist id="onboarding-business">
                {BUSINESS_TYPES.map((item) => (
                  <option value={item} key={item} />
                ))}
              </datalist>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Dari mana tahu UMKM Kits Studio?</p>
            <Select
              value={source || undefined}
              onValueChange={(value) => setSource(value as OnboardingAnswers["ref_source"])}
            >
              <SelectTrigger className="text-white placeholder:text-muted-foreground">
                <SelectValue placeholder="Pilih sumber" />
              </SelectTrigger>
              <SelectContent className="text-foreground">
                {SOURCE_OPTIONS.map((item) => (
                  <SelectItem key={item.value} value={item.value} className="text-foreground">
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {source === "other" ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Ceritakan lebih lanjut (opsional)</p>
              <Input
                value={otherNote}
                onChange={(event) => setOtherNote(event.target.value)}
                placeholder="Tulis detail tambahan"
                className="text-white placeholder:text-muted-foreground"
              />
            </div>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            className="text-sm text-muted-foreground hover:text-foreground"
            onClick={handleSkip}
            disabled={isBusy}
          >
            {isSkipping ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Memproses...
              </span>
            ) : (
              "Lewati dulu"
            )}
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={!isValid || isBusy}>
            {isSaving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Menyimpan...
              </span>
            ) : (
              "Simpan jawaban"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
