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
