import { supabase } from "@/integrations/supabase/client";

// Shared demo account — every visitor is auto-signed-in as this user.
const DEMO_EMAIL = "demo-shared@guardianauto.app";
const DEMO_PASSWORD = "guardianauto-demo-shared-2026";

let inflight: Promise<void> | null = null;

export async function ensureDemoSession(): Promise<void> {
  const { data } = await supabase.auth.getSession();
  if (data.session) return;
  if (inflight) return inflight;

  inflight = (async () => {
    const signIn = await supabase.auth.signInWithPassword({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    });
    if (!signIn.error) return;

    // Account doesn't exist yet — create it, then sign in.
    const signUp = await supabase.auth.signUp({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    });
    if (signUp.error && !/registered/i.test(signUp.error.message)) {
      throw signUp.error;
    }
    const retry = await supabase.auth.signInWithPassword({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    });
    if (retry.error) throw retry.error;
  })().finally(() => {
    inflight = null;
  });

  return inflight;
}
