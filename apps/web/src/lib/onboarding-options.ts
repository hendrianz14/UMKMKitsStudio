export const PURPOSES = [
  { value: "sell_more", label: "Meningkatkan penjualan" },
  { value: "brand_build", label: "Membangun brand" },
  { value: "content_auto", label: "Otomasi konten" },
  { value: "other", label: "Lainnya" },
] as const;

export type OnboardingPurpose = (typeof PURPOSES)[number]["value"];

export const PURPOSE_VALUES = PURPOSES.map((option) => option.value) as [
  OnboardingPurpose,
  ...OnboardingPurpose[]
];

export const SOURCES = [
  { value: "friend", label: "Teman" },
  { value: "search", label: "Pencarian (Google, dsb.)" },
  { value: "ads", label: "Iklan" },
  { value: "other", label: "Lainnya" },
] as const;

export type OnboardingRefSource = (typeof SOURCES)[number]["value"];

export const SOURCE_VALUES = SOURCES.map((option) => option.value) as [
  OnboardingRefSource,
  ...OnboardingRefSource[]
];
