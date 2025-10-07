"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@utils/supabase/server";

export async function signInWithGoogle() {
  const supabase = await createClient();

  const origin =
    (await headers()).get("origin") ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000";
  const redirectTo = `${origin}/auth/callback`;
  console.log(redirectTo);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
    },
  });

  if (error) {
    console.error("Google OAuth error:", error.message);
    redirect(`/auth/error?message=${encodeURIComponent(error.message)}`);
  }

  if (data?.url) redirect(data.url);

  redirect("/");
}
