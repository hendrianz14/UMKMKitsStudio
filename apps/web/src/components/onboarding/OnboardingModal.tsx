"use client";

import { useMemo, useState } from "react";
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
  userType: "personal" | "team";
  goal: string;
  businessType: string;
  source: string;
}

interface OnboardingModalProps {
  open: boolean;
  defaultValues?: Partial<OnboardingAnswers>;
  onSave: (answers: OnboardingAnswers) => Promise<void>;
  onSkip: () => Promise<void>;
}

const USER_TYPES: Array<{ value: OnboardingAnswers["userType"]; label: string }> = [
  { value: "personal", label: "Personal" },
  { value: "team", label: "Tim" },
];

const GOALS = [
  "Konten IG/TikTok",
  "Katalog produk",
  "Iklan",
  "Lainnya",
];

const BUSINESS_TYPES = [
  "Kuliner",
  "Fashion",
  "Kecantikan",
  "Kerajinan",
  "F&B",
  "Elektronik",
];

const SOURCES = [
  "Teman",
  "TikTok",
  "Instagram",
  "Google",
  "Lainnya",
];

export function OnboardingModal({ open, defaultValues, onSave, onSkip }: OnboardingModalProps) {
  const [userType, setUserType] = useState<OnboardingAnswers["userType"]>(
    defaultValues?.userType ?? "personal"
  );
  const [goal, setGoal] = useState(defaultValues?.goal ?? "");
  const [businessType, setBusinessType] = useState(defaultValues?.businessType ?? "");
  const [source, setSource] = useState(defaultValues?.source ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = useMemo(() => {
    return Boolean(goal && businessType.trim() && source);
  }, [goal, businessType, source]);

  const handleSubmit = async () => {
    if (!isValid) return;
    setLoading(true);
    setError(null);
    try {
      await onSave({
        userType,
        goal,
        businessType: businessType.trim(),
        source,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan jawaban.");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    setError(null);
    try {
      await onSkip();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui status.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-2xl space-y-6">
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
                  variant={userType === option.value ? "primary" : "secondary"}
                  onClick={() => setUserType(option.value)}
                  className={cn(
                    "flex-1 border border-border/60",
                    userType === option.value ? "shadow-glow" : "bg-background/40"
                  )}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Tujuan utama pakai UMKM Kits</p>
            <Select value={goal} onValueChange={setGoal}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih tujuan" />
              </SelectTrigger>
              <SelectContent>
                {GOALS.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
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
                value={businessType}
                onChange={(event) => setBusinessType(event.target.value)}
                placeholder="Contoh: Kuliner"
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
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih sumber" />
              </SelectTrigger>
              <SelectContent>
                {SOURCES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            className="text-sm text-muted-foreground hover:text-foreground"
            onClick={handleSkip}
            disabled={loading}
          >
            Lewati dulu
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={!isValid || loading}>
            {loading ? (
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
