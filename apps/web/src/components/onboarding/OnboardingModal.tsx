"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { SelectInput } from "./SelectInput";

type UserType = "Personal" | "Tim";

type Answers = {
  usage_type: "personal" | "team";
  purpose: string;
  business_type: string;
  ref_source: string;
  other_note?: string;
};

export type OnboardingModalProps = {
  open: boolean;
  onClose: () => void;
  initial?: {
    usage_type?: "personal" | "team";
    purpose?: string;
    business_type?: string;
    ref_source?: string;
    other_note?: string;
  };
  onSubmit?: (answers: Answers) => Promise<void> | void;
  locale?: string;
};

export default function OnboardingModal({ open, onClose, initial, onSubmit }: OnboardingModalProps) {
  if (!open) return null;

  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [stateUserType, setStateUserType] = useState<UserType>(
    initial?.usage_type === "team" ? "Tim" : "Personal"
  );
  const [stateMainPurpose, setStateMainPurpose] = useState(initial?.purpose ?? "");
  const [stateBusinessType, setStateBusinessType] = useState(initial?.business_type ?? "Kuliner");
  const [stateSource, setStateSource] = useState(initial?.ref_source ?? "");
  const [stateOtherNote, setStateOtherNote] = useState(initial?.other_note ?? "");

  const handleSave = async () => {
    if (saving) return;
    if (!stateMainPurpose || !stateBusinessType.trim() || !stateSource) {
      return;
    }

    setSaving(true);
    const answers: Answers = {
      usage_type: stateUserType === "Tim" ? "team" : "personal",
      purpose: stateMainPurpose,
      business_type: stateBusinessType,
      ref_source: stateSource,
      other_note: stateOtherNote || undefined,
    };

    try {
      if (onSubmit) {
        await onSubmit(answers);
      } else {
        const response = await fetch("/api/profile/onboarding/save", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ answers }),
        });

        if (!response.ok) {
          console.error("onboarding/save failed:", await response.text());
          setSaving(false);
          return;
        }
      }

      onClose();
      router.refresh();
    } catch (error) {
      console.error("onboarding/save error:", error);
      setSaving(false);
      return;
    }

    setSaving(false);
  };

  const handleSkip = () => {
    if (saving) return;
    onClose();
  };

  const purposeOptions = [
    { value: "content", label: "Membuat konten promosi" },
    { value: "branding", label: "Meningkatkan branding usaha" },
    { value: "social", label: "Manajemen media sosial" },
    { value: "other", label: "Lainnya" },
  ];

  const businessTypeOptions = [
    { value: "Kuliner", label: "Kuliner" },
    { value: "Fashion", label: "Fashion" },
    { value: "Jasa", label: "Jasa" },
    { value: "Kecantikan", label: "Kecantikan" },
    { value: "Retail", label: "Retail" },
  ];

  const sourceOptions = [
    { value: "social_media", label: "Media Sosial" },
    { value: "friends", label: "Teman/Keluarga" },
    { value: "google", label: "Pencarian Google" },
    { value: "ads", label: "Iklan" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg bg-[#161B22] rounded-2xl p-8 space-y-8 border border-gray-800 shadow-2xl shadow-black/20">
        <div>
          <h1 className="text-3xl font-bold text-white">Kenalan dulu yuk!</h1>
          <p className="mt-2 text-gray-400">
            Jawaban kamu membantu kami menyesuaikan rekomendasi template dan otomasi konten.
          </p>
        </div>

        <form className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tipe pengguna</label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#21262D] rounded-lg">
              <button
                type="button"
                onClick={() => setStateUserType("Personal")}
                className={`w-full py-2.5 rounded-md text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#21262D] focus:ring-blue-500 ${stateUserType === "Personal" ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-700/50"}`}
              >
                Personal
              </button>
              <button
                type="button"
                onClick={() => setStateUserType("Tim")}
                className={`w-full py-2.5 rounded-md text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#21262D] focus:ring-blue-500 ${stateUserType === "Tim" ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-700/50"}`}
              >
                Tim
              </button>
            </div>
          </div>

          <SelectInput
            label="Tujuan utama pakai UMKM Kits"
            value={stateMainPurpose}
            onChange={(e) => setStateMainPurpose(e.target.value)}
            options={purposeOptions}
            placeholder="Pilih tujuan utama"
          />

          <SelectInput
            label="Jenis usaha"
            value={stateBusinessType}
            onChange={(e) => setStateBusinessType(e.target.value)}
            options={businessTypeOptions}
          />

          <SelectInput
            label="Dari mana tahu UMKM Kits Studio?"
            value={stateSource}
            onChange={(e) => setStateSource(e.target.value)}
            options={sourceOptions}
            placeholder="Pilih sumber"
          />

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Catatan tambahan</label>
            <textarea
              className="w-full rounded-lg border border-gray-700 bg-[#0D1117] p-3 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              rows={3}
              value={stateOtherNote}
              onChange={(event) => setStateOtherNote(event.target.value)}
              placeholder="Boleh diisi jika ada kebutuhan khusus"
            />
          </div>
        </form>

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleSkip}
            className="text-gray-400 hover:text-white transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#161B22] focus:ring-blue-500 rounded-md px-2 py-1"
            disabled={saving}
          >
            Lewati dulu
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#161B22] focus:ring-blue-500"
            disabled={saving}
          >
            {saving ? "Menyimpan..." : "Simpan jawaban"}
          </button>
        </div>
      </div>
    </div>
  );
}
