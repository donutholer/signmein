"use server";

import { redirect } from "next/navigation";
import { createClient } from "@utils/supabase/server";

export async function chooseRole(role: "student" | "staff") {
  const supabase = await createClient();

  const {
    data: { user },
    error: getUserErr,
  } = await supabase.auth.getUser();
  if (getUserErr || !user) {
    redirect("/signin");
  }

  const { error: updateErr } = await supabase.auth.updateUser({
    data: { role },
  });
  if (updateErr) {
    redirect("/error");
  }

  redirect("/");
}
