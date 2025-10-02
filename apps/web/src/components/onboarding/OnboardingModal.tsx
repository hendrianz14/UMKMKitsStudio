"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
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
import {
  PURPOSES,
  SOURCES,
  type OnboardingPurpose,
  type OnboardingRefSource,
} from "@/lib/onboarding-options";
import { cn } from "@/lib/utils";

export interface OnboardingAnswers {
  usage_type: "personal" | "team";
  purpose: OnboardingPurpose;
  business_type: string;
  ref_source: OnboardingRefSource;
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

const LEGACY_PURPOSE_MAP: Record<string, OnboardingPurpose> = {
  ig: "content_auto",
  "konten ig/tiktok": "content_auto",
  catalog: "sell_more",
  "katalog produk": "sell_more",
  ads: "sell_more",
  "iklan": "sell_more",
  lainnya: "other",
};

const LEGACY_SOURCE_MAP: Record<string, OnboardingRefSource> = {
  ad: "ads",
  ads: "ads",
  "iklan": "ads",
  teman: "friend",
  "pencarian (google, dsb.)": "search",
  lainnya: "other",
};

const BUSINESS_TYPES = [
  "Kuliner",
  "Fashion",
  "Kecantikan",
  "Kerajinan",
  "F&B",
  "Elektronik",
];

type OnboardingForm = {
  usage_type: OnboardingAnswers["usage_type"];
  purpose: string;
  business_type: string;
  ref_source: string;
  other_note?: string;
};

const resolvePurpose = (value?: string | null): OnboardingPurpose | "" => {
  if (!value) return "";
  const normalized = value.trim().toLowerCase();
  const direct = PURPOSES.find((option) => option.value === value);
  if (direct) {
    return direct.value;
  }
  const byLabel = PURPOSES.find((option) => option.label.toLowerCase() === normalized);
  if (byLabel) {
    return byLabel.value;
  }
  return LEGACY_PURPOSE_MAP[normalized] ?? "";
};

const resolveSource = (value?: string | null): OnboardingRefSource | "" => {
  if (!value) return "";
  const normalized = value.trim().toLowerCase();
  const direct = SOURCES.find((option) => option.value === value);
  if (direct) {
    return direct.value;
  }
  const byLabel = SOURCES.find((option) => option.label.toLowerCase() === normalized);
  if (byLabel) {
    return byLabel.value;
  }
  return LEGACY_SOURCE_MAP[normalized] ?? "";
};

export function OnboardingModal({ open, defaultValues, onSave, onSkip }: OnboardingModalProps) {
  const [status, setStatus] = useState<"idle" | "saving" | "skipping">("idle");
  const [error, setError] = useState<string | null>(null);
  const resolvedPurpose = useMemo(
    () => resolvePurpose(defaultValues?.purpose ?? null),
    [defaultValues?.purpose]
  );
  const resolvedSource = useMemo(
    () => resolveSource(defaultValues?.ref_source ?? null),
    [defaultValues?.ref_source]
  );
  const defaultUsageType = defaultValues?.usage_type ?? "personal";
  const defaultBusiness = defaultValues?.business_type ?? "";
  const defaultOtherNote = defaultValues?.other_note ?? "";

  const form = useForm<OnboardingForm>({
    defaultValues: {
      usage_type: defaultUsageType,
      purpose: resolvedPurpose,
      business_type: defaultBusiness,
      ref_source: resolvedSource,
      other_note: defaultOtherNote,
    },
    mode: "onChange",
  });

  const usageType = form.watch("usage_type");
  const purpose = form.watch("purpose") ?? "";
  const industry = form.watch("business_type") ?? "";
  const source = form.watch("ref_source") ?? "";
  const otherNote = form.watch("other_note") ?? "";

  const isValid = useMemo(() => {
    return Boolean(purpose && industry.trim() && source);
  }, [purpose, industry, source]);

  useEffect(() => {
    if (!open) return;
    form.reset({
      usage_type: defaultUsageType,
      purpose: resolvedPurpose,
      business_type: defaultBusiness,
      ref_source: resolvedSource,
      other_note: defaultOtherNote,
    });
    setError(null);
  }, [
    open,
    defaultUsageType,
    resolvedPurpose,
    defaultBusiness,
    resolvedSource,
    defaultOtherNote,
    form,
  ]);

  useEffect(() => {
    setError(null);
  }, [purpose, industry, source, otherNote]);

  const isSaving = status === "saving";
  const isSkipping = status === "skipping";
  const isBusy = status !== "idle";

  const onSubmit = form.handleSubmit(
    async (values) => {
      if (!values.purpose || !values.ref_source || !values.business_type.trim()) {
        setError("Lengkapi semua bidang wajib terlebih dahulu.");
        return;
      }

      setStatus("saving");
      setError(null);
      try {
        const trimmedOther = (values.other_note ?? "").trim();
        await onSave({
          usage_type: values.usage_type,
          purpose: values.purpose as OnboardingPurpose,
          business_type: values.business_type.trim(),
          ref_source: values.ref_source as OnboardingRefSource,
          other_note: trimmedOther ? trimmedOther : undefined,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal menyimpan jawaban.");
      } finally {
        setStatus("idle");
      }
    },
    () => {
      setError("Lengkapi semua bidang wajib terlebih dahulu.");
    }
  );

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
        <form onSubmit={onSubmit} className="space-y-6">
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
                    onClick={() =>
                      form.setValue("usage_type", option.value, {
                        shouldDirty: true,
                        shouldTouch: true,
                      })
                    }
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
              <Controller
                name="purpose"
                control={form.control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Select value={field.value || ""} onValueChange={field.onChange}>
                    <SelectTrigger
                      ref={field.ref}
                      onBlur={field.onBlur}
                      className="text-white placeholder:text-muted-foreground"
                    >
                      <SelectValue placeholder="Pilih tujuan" />
                    </SelectTrigger>
                    <SelectContent className="text-foreground">
                      {PURPOSES.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          className="text-foreground"
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Jenis usaha</p>
              <div>
                <Input
                  list="onboarding-business"
                  placeholder="Contoh: Kuliner"
                  className="text-white placeholder:text-muted-foreground"
                  {...form.register("business_type", {
                    validate: (value) => value.trim().length > 0,
                  })}
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
              <Controller
                name="ref_source"
                control={form.control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Select value={field.value || ""} onValueChange={field.onChange}>
                    <SelectTrigger
                      ref={field.ref}
                      onBlur={field.onBlur}
                      className="text-white placeholder:text-muted-foreground"
                    >
                      <SelectValue placeholder="Pilih sumber" />
                    </SelectTrigger>
                    <SelectContent className="text-foreground">
                      {SOURCES.map((item) => (
                        <SelectItem
                          key={item.value}
                          value={item.value}
                          className="text-foreground"
                        >
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            {source === "other" ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Ceritakan lebih lanjut (opsional)</p>
                <Input
                  placeholder="Tulis detail tambahan"
                  className="text-white placeholder:text-muted-foreground"
                  {...form.register("other_note")}
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
            <Button type="submit" disabled={!isValid || isBusy}>
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
        </form>
      </DialogContent>
    </Dialog>
  );
}
