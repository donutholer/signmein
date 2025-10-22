"use server";

import { redirect } from "next/navigation";
import { createClient } from "@utils/supabase/server";
import { createAdminClient } from "@utils/supabase/admin";
import { currentWindow, signQR, verifyQR } from "@utils/qr";

export async function createSession(name?: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error: uErr,
  } = await supabase.auth.getUser();
  if (uErr || !user) redirect("/signin");

  if (user.user_metadata?.role !== "staff") redirect("/");

  const { data, error } = await supabase
    .from("sessions")
    .insert({ staff_user_id: user.id, name })
    .select("id")
    .single();

  if (error) throw error;
  return data.id as string;
}

export async function endSession(sessionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.role !== "staff") redirect("/");

  const { error } = await supabase
    .from("sessions")
    .update({ active: false })
    .eq("id", sessionId)
    .eq("staff_user_id", user.id);

  if (error) throw error;
  return true;
}

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

export async function scanAndCheckIn(qrPayload: string, sessionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.role !== "staff") redirect("/");

  const parts = qrPayload.split(":");
  if (parts.length !== 3) throw new Error("Invalid QR format");
  const [studentId, windowStr, sig] = parts;
  const window = Number(windowStr);
  if (!studentId || !Number.isFinite(window) || !sig)
    throw new Error("Invalid QR parts");

  const ok = verifyQR(studentId, window, sig);
  if (!ok) throw new Error("QR expired or invalid");

  const { data: sess, error: sErr } = await supabase
    .from("sessions")
    .select("id, staff_user_id, active")
    .eq("id", sessionId)
    .single();

  if (sErr || !sess) throw new Error("Session not found");
  if (sess.staff_user_id !== user.id) throw new Error("Not your session");
  if (!sess.active) throw new Error("Session is not active");

  // Get student information from auth using admin client
  const adminClient = createAdminClient();
  const { data: studentData } = await adminClient.auth.admin.getUserById(studentId);

  const { error: iErr } = await supabase
    .from("checkins")
    .insert({
      session_id: sessionId,
      student_user_id: studentId,
      student_email: studentData?.user?.email || null,
      student_name: studentData?.user?.user_metadata?.name || studentData?.user?.user_metadata?.full_name || null,
    });

  if (iErr) {
    if (iErr.code === "23505") return { ok: true, duplicate: true };
    throw iErr;
  }

  return { ok: true, duplicate: false };
}
