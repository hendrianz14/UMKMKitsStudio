export const PURPOSES = [
  { value: "content", label: "Membuat konten promosi" },
  { value: "branding", label: "Meningkatkan branding usaha" },
  { value: "social", label: "Manajemen media sosial" },
  { value: "other", label: "Lainnya" },
] as const;

export type OnboardingPurpose = (typeof PURPOSES)[number]["value"];

export const PURPOSE_VALUES = PURPOSES.map((option) => option.value) as [
  OnboardingPurpose,
  ...OnboardingPurpose[]
];

export const SOURCES = [
  { value: "social_media", label: "Media Sosial" },
  { value: "friends", label: "Teman/Keluarga" },
  { value: "google", label: "Pencarian Google" },
  { value: "ads", label: "Iklan" },
] as const;

export type OnboardingRefSource = (typeof SOURCES)[number]["value"];

export const SOURCE_VALUES = SOURCES.map((option) => option.value) as [
  OnboardingRefSource,
  ...OnboardingRefSource[]
];
