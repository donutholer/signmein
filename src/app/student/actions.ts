"use server";

import { redirect } from "next/navigation";
import { createClient } from "@utils/supabase/server";
import { currentWindow, signQR } from "@utils/qr";

export async function issueStudentQR() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const w = currentWindow();
  const sig = signQR(user.id, w);
  return `${user.id}:${w}:${sig}`;
}

export async function getUserRole() {
  const supabase = await createClient();
  const {
    data: { user },
    error: getUserErr,
  } = await supabase.auth.getUser();
  if (getUserErr || !user) {
    redirect("/signin");
  }

  const role = user.user_metadata.role as string | undefined;
  return role || null;
}
