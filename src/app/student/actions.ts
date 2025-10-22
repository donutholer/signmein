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

  // Ensure user is a student
  if (user.user_metadata?.role !== "student") {
    redirect("/scan");
  }

  const w = currentWindow();
  const sig = signQR(user.id, w);
  return `${user.id}:${w}:${sig}`;
}
