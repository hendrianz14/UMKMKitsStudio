import { supaAdmin } from "./supabase-server";

/**
 * Returns whether the provided email has a consumed OTP created within the specified time window.
 * @param email Email address to check.
 * @param withinMs Time window in milliseconds. Defaults to 15 minutes.
 */
export async function otpVerifiedRecently(
  email: string,
  withinMs = 15 * 60_000,
): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return false;
  }

  const supabase = supaAdmin();
  const sinceIso = new Date(Date.now() - withinMs).toISOString();

  const { data, error } = await supabase
    .from("email_otps")
    .select("id")
    .eq("email", normalizedEmail)
    .eq("consumed", true)
    .gte("created_at", sinceIso)
    .limit(1);

  if (error) {
    console.error("[otp-verified-recent] Failed to check OTP history", error);
    return false;
  }

  return (data?.length ?? 0) > 0;
}
