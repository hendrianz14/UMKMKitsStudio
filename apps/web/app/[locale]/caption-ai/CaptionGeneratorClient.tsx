"use client";

import { useMemo, useState } from "react";
import type { Locale as DateLocale } from "date-fns";
import { formatDistanceToNow } from "date-fns";
import { enUS, id as idLocale } from "date-fns/locale";
import {
  ArrowRight,
  Check,
  ClipboardCopy,
  ClipboardList,
  Loader2,
  Sparkles,
  Wand2,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { CardX, CardXFooter, CardXHeader } from "@/components/ui/cardx";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

type CaptionHistoryItem = {
  id: string;
  status: string;
  created_at: string;
  result_url?: string | null;
  meta?: Record<string, any> | null;
};

type CaptionResult = {
  jobId: string;
  status: string;
  primary?: string | null;
  variations: Array<{ id: string; caption: string; tone?: string }>;
  hashtags?: string[];
  insights?: {
    hook?: string;
    story?: string;
    closing?: string;
    promptUsed?: string;
  } | null;
  meta?: Record<string, any> | null;
};

type CaptionGeneratorClientProps = {
  locale: string;
  initialHistory: CaptionHistoryItem[];
};

type FormState = {
  brief: string;
  platform: string;
  tone: string;
  audience: string;
  language: string;
  length: "short" | "medium" | "long";
  includeHashtags: boolean;
  includeCTA: boolean;
  includeEmoji: boolean;
  customHashtags: string;
  customCTA: string;
  brandVoice: string;
  differentiator: string;
  keywords: string;
  competitorAngles: string;
  variations: number;
};

const textareaBaseClass =
  "min-h-[120px] w-full rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm text-foreground transition focus:outline-none focus:ring-2 focus:ring-primary/50";

const languageLocales: Record<string, DateLocale> = {
  id: idLocale,
  en: enUS,
};

const PLATFORM_OPTIONS = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "facebook", label: "Facebook" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "twitter", label: "Twitter / X" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "general", label: "Omni-channel" },
];

const TONE_OPTIONS = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "playful", label: "Playful" },
  { value: "luxurious", label: "Luxurious" },
  { value: "bold", label: "Bold" },
];

const LENGTH_OPTIONS: Array<{ value: FormState["length"]; label: string; range: string }> = [
  { value: "short", label: "Short", range: "60-80" },
  { value: "medium", label: "Medium", range: "120-160" },
  { value: "long", label: "Long", range: "220-280" },
];

const LANGUAGE_OPTIONS = [
  { value: "id", label: "Bahasa Indonesia" },
  { value: "en", label: "English" },
];

const BRIEF_PRESETS = [
  {
    id: "coffee",
    title: "Signature coffee soft launch",
    value:
      "Launching menu seasonal Es Kopi Aren premium dengan gula aren artisan, highlight pada rasa smoky dan tekstur creamy. Target pekerja kantoran usia 23-35 dengan promo bundling pagi hari.",
    tone: "professional",
    platform: "instagram",
  },
  {
    id: "bakery",
    title: "Artisan sourdough drop",
    value:
      "Buka pre-order sourdough loaf terbatas dengan topping garlic butter dan keju lokal. Tekankan bahan alami dan fermentasi 48 jam, cocok untuk sarapan keluarga muda.",
    tone: "friendly",
    platform: "whatsapp",
  },
  {
    id: "beverage",
    title: "Fresh juice campaign",
    value:
      "Promo paket detox jus cold-pressed 3 hari dengan konsultasi gizi gratis. Fokus pada manfaat kesehatan, ingredients lokal, dan testimoni pelanggan.",
    tone: "luxurious",
    platform: "tiktok",
  },
];

export default function CaptionGeneratorClient({
  locale,
  initialHistory,
}: CaptionGeneratorClientProps) {
  const t = useTranslations("captionAi");
  const [form, setForm] = useState<FormState>({
    brief: BRIEF_PRESETS[0]?.value ?? "",
    platform: BRIEF_PRESETS[0]?.platform ?? "instagram",
    tone: BRIEF_PRESETS[0]?.tone ?? "professional",
    audience: "Pekerja kantoran urban, suka trend kopi modern",
    language: locale === "en" ? "en" : "id",
    length: "medium",
    includeHashtags: true,
    includeCTA: true,
    includeEmoji: true,
    customHashtags: "#umkmindonesia, #minumanhits, #supportlocal",
    customCTA: "Pesan sekarang melalui link di bio",
    brandVoice: "Optimis, percaya diri, mengedepankan kualitas lokal dengan sentuhan modern.",
    differentiator: "Menggunakan gula aren organik dari petani lokal dengan proses manual harian.",
    keywords: "kopi gula aren, creamy, smoky, promo bundling",
    competitorAngles: "kopi franchise premium, coffee shop artisan",
    variations: 3,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CaptionResult | null>(null);
  const [history, setHistory] = useState<CaptionHistoryItem[]>(initialHistory);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeLocale = languageLocales[form.language] ?? idLocale;

  const handleChange = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.brief.trim()) {
      setError(t("errors.emptyBrief"));
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/ai/caption", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
        }),
      });
      const data = (await response.json()) as CaptionResult & { error?: string };
      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to generate caption");
      }
      setResult(data);
      setHistory((prev) => [
        {
          id: data.jobId,
          status: data.status,
          created_at: new Date().toISOString(),
          result_url: data.resultUrl ?? null,
          meta: data.meta ?? null,
        },
        ...prev,
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = async (value: string, id: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (err) {
      console.warn("[caption-ai] Clipboard copy failed", err);
    }
  };

  const handlePreset = (presetId: string) => {
    const preset = BRIEF_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;
    setForm((prev) => ({
      ...prev,
      brief: preset.value,
      tone: preset.tone,
      platform: preset.platform,
    }));
  };

  const generatedVariations = useMemo(() => {
    if (!result) return [] as Array<{ id: string; caption: string; tone?: string }>;
    if (Array.isArray(result.variations) && result.variations.length > 0) {
      return result.variations;
    }
    if (result.primary) {
      return [
        {
          id: `${result.jobId}-primary`,
          caption: result.primary,
          tone: result.meta?.tone ?? form.tone,
        },
      ];
    }
    return [];
  }, [result, form.tone]);

  return (
    <div className="space-y-8">
      <CardX tone="glass" padding="lg" className="border-primary/20">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold text-foreground lg:text-4xl">
              {t("title")}
            </h1>
            <p className="max-w-3xl text-sm text-muted-foreground lg:text-base">
              {t("subtitle")}
            </p>
          </div>
          <div className="grid gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>{t("capabilities.pipelines")}</span>
            </div>
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" />
              <span>{t("capabilities.templates")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-primary" />
              <span>{t("capabilities.custom")}</span>
            </div>
          </div>
        </div>
      </CardX>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.62fr)_minmax(0,0.38fr)]">
        <div className="space-y-6">
          <CardX tone="surface" padding="lg" className="space-y-6">
            <CardXHeader title={t("form.title")} subtitle={t("form.subtitle")} />
            {error ? (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {t("errors.general", { message: error })}
              </div>
            ) : null}
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid gap-6 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">{t("form.platform")}</span>
                  <Select value={form.platform} onValueChange={(value) => handleChange("platform", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Instagram" />
                    </SelectTrigger>
                    <SelectContent>
                      {PLATFORM_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">{t("form.tone")}</span>
                  <Select value={form.tone} onValueChange={(value) => handleChange("tone", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Professional" />
                    </SelectTrigger>
                    <SelectContent>
                      {TONE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">{t("form.language")}</span>
                  <Select value={form.language} onValueChange={(value) => handleChange("language", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">{t("form.length")}</span>
                  <Select
                    value={form.length}
                    onValueChange={(value) =>
                      handleChange("length", value as FormState["length"])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LENGTH_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label} · {t("form.characters", { range: option.range })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {t("form.characters", {
                      range: LENGTH_OPTIONS.find((option) => option.value === form.length)?.range ?? "120-160",
                    })}
                  </p>
                </label>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">{t("form.variationLabel")}</span>
                <div className="rounded-2xl border border-border bg-background/40 px-4 py-3">
                  <Slider
                    value={[form.variations]}
                    min={1}
                    max={5}
                    step={1}
                    onValueChange={([value]) => handleChange("variations", value)}
                  />
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{t("form.variations", { count: form.variations })}</span>
                    <span>{t("form.variationHint")}</span>
                  </div>
                </div>
              </div>

              <label className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">{t("form.brief")}</span>
                <textarea
                  className={textareaBaseClass}
                  value={form.brief}
                  onChange={(event) => handleChange("brief", event.target.value)}
                  placeholder={t("placeholders.brief")}
                />
              </label>

              <div className="grid gap-6 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">{t("form.audience")}</span>
                  <Input
                    value={form.audience}
                    onChange={(event) => handleChange("audience", event.target.value)}
                    placeholder={t("placeholders.audience")}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">{t("form.brandVoice")}</span>
                  <Input
                    value={form.brandVoice}
                    onChange={(event) => handleChange("brandVoice", event.target.value)}
                    placeholder={t("placeholders.brandVoice")}
                  />
                </label>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">{t("form.keywords")}</span>
                  <textarea
                    className={cn(textareaBaseClass, "min-h-[100px]")}
                    value={form.keywords}
                    onChange={(event) => handleChange("keywords", event.target.value)}
                    placeholder={t("placeholders.keywords")}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">{t("form.competitorAngles")}</span>
                  <textarea
                    className={cn(textareaBaseClass, "min-h-[100px]")}
                    value={form.competitorAngles}
                    onChange={(event) => handleChange("competitorAngles", event.target.value)}
                    placeholder={t("placeholders.competitorAngles")}
                  />
                </label>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <label className="flex items-start gap-3 rounded-2xl border border-border bg-background/40 px-4 py-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-border bg-background/80"
                    checked={form.includeHashtags}
                    onChange={(event) => handleChange("includeHashtags", event.target.checked)}
                  />
                  <div className="space-y-1 text-sm">
                    <p className="font-medium text-foreground">{t("form.includeHashtags")}</p>
                    <p className="text-xs text-muted-foreground">{t("form.includeHashtagsHint")}</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 rounded-2xl border border-border bg-background/40 px-4 py-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-border bg-background/80"
                    checked={form.includeCTA}
                    onChange={(event) => handleChange("includeCTA", event.target.checked)}
                  />
                  <div className="space-y-1 text-sm">
                    <p className="font-medium text-foreground">{t("form.includeCTA")}</p>
                    <p className="text-xs text-muted-foreground">{t("form.includeCTAHint")}</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 rounded-2xl border border-border bg-background/40 px-4 py-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-border bg-background/80"
                    checked={form.includeEmoji}
                    onChange={(event) => handleChange("includeEmoji", event.target.checked)}
                  />
                  <div className="space-y-1 text-sm">
                    <p className="font-medium text-foreground">{t("form.includeEmoji")}</p>
                    <p className="text-xs text-muted-foreground">{t("form.includeEmojiHint")}</p>
                  </div>
                </label>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">{t("form.customHashtags")}</span>
                  <textarea
                    className={cn(textareaBaseClass, "min-h-[80px]")}
                    value={form.customHashtags}
                    onChange={(event) => handleChange("customHashtags", event.target.value)}
                    placeholder={t("placeholders.hashtags")}
                    disabled={!form.includeHashtags}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">{t("form.customCTA")}</span>
                  <textarea
                    className={cn(textareaBaseClass, "min-h-[80px]")}
                    value={form.customCTA}
                    onChange={(event) => handleChange("customCTA", event.target.value)}
                    placeholder={t("placeholders.cta")}
                    disabled={!form.includeCTA}
                  />
                </label>
              </div>

              <CardXFooter>
                <Button type="submit" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("actions.generating")}
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      {t("actions.generate")}
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleChange("brief", "")}
                  disabled={isSubmitting}
                >
                  {t("actions.clear")}
                </Button>
              </CardXFooter>
            </form>
          </CardX>

          <CardX tone="surface" padding="lg" className="space-y-6">
            <CardXHeader title={t("output.title")} subtitle={t("output.subtitle")} />
            {result ? (
              <div className="space-y-6">
                {generatedVariations.map((variation) => (
                  <div key={variation.id} className="rounded-2xl border border-border/60 bg-background/40 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-primary">
                          <Sparkles className="h-4 w-4" />
                          {t("output.variant")}
                        </div>
                        <p className="whitespace-pre-line text-sm text-foreground">{variation.caption}</p>
                        {Array.isArray(result.hashtags) && result.hashtags.length > 0 ? (
                          <p className="text-xs text-primary/80">{result.hashtags.join(" ")}</p>
                        ) : null}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9"
                        onClick={() => handleCopy(variation.caption, variation.id)}
                      >
                        {copiedId === variation.id ? (
                          <Check className="h-4 w-4 text-primary" />
                        ) : (
                          <ClipboardCopy className="h-4 w-4" />
                        )}
                        <span className="sr-only">{t("output.copy")}</span>
                      </Button>
                    </div>
                  </div>
                ))}
                {result?.insights ? (
                  <div className="rounded-2xl border border-border/60 bg-background/40 p-5">
                    <h3 className="text-sm font-semibold text-foreground">
                      {t("output.insightsTitle")}
                    </h3>
                    <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                      {result.insights.hook ? <li>• {result.insights.hook}</li> : null}
                      {result.insights.story ? <li>• {result.insights.story}</li> : null}
                      {result.insights.closing ? <li>• {result.insights.closing}</li> : null}
                    </ul>
                    {result.insights.promptUsed ? (
                      <p className="mt-3 text-xs text-muted-foreground/80">
                        {t("output.prompt")}: {result.insights.promptUsed}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border/60 bg-background/20 p-6 text-center text-sm text-muted-foreground">
                {t("output.emptyState")}
              </div>
            )}
          </CardX>
        </div>

        <div className="space-y-6">
          <CardX tone="surface" padding="lg" className="space-y-6">
            <CardXHeader title={t("presets.title")} subtitle={t("presets.subtitle")} />
            <div className="grid gap-3">
              {BRIEF_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePreset(preset.id)}
                  className="group rounded-2xl border border-border bg-background/30 px-4 py-4 text-left transition hover:border-primary/60 hover:bg-primary/5"
                >
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary">
                    {preset.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{preset.value}</p>
                </button>
              ))}
            </div>
          </CardX>

          <CardX tone="surface" padding="lg" className="space-y-6">
            <CardXHeader title={t("history.title")} subtitle={t("history.subtitle")} />
            {history.length > 0 ? (
              <ul className="space-y-4 text-sm">
                {history.slice(0, 6).map((item) => (
                  <li key={item.id} className="rounded-2xl border border-border/60 bg-background/30 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">#{item.id.slice(0, 8)}</p>
                        <p className="text-xs uppercase tracking-[0.3em] text-primary">
                          {item.status.toUpperCase()}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(item.created_at), {
                          addSuffix: true,
                          locale: activeLocale,
                        })}
                      </span>
                    </div>
                    {item.meta?.platform || item.meta?.tone ? (
                      <p className="mt-3 text-xs text-muted-foreground">
                        {item.meta?.platform ? `${item.meta.platform}` : ""}
                        {item.meta?.tone ? ` • ${item.meta.tone}` : ""}
                      </p>
                    ) : null}
                    {item.result_url ? (
                      <a
                        className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-primary hover:text-primary/80"
                        href={item.result_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t("history.viewWorkflow")}
                        <ArrowRight className="h-3 w-3" />
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">{t("history.empty")}</p>
            )}
          </CardX>
        </div>
      </div>
    </div>
  );
}
