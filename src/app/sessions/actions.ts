"use server";

import { redirect } from "next/navigation";
import { createClient } from "@utils/supabase/server";

export type Session = {
  id: string;
  name: string | null;
  active: boolean;
  created_at: string;
  staff_user_id: string;
};

export type CheckIn = {
  id: string;
  session_id: string;
  student_user_id: string;
  created_at: string;
  student_email: string | null;
  student_name: string | null;
};

export async function getStaffSessions() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== "staff") {
    redirect("/");
  }

  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("staff_user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data as Session[];
}

export async function getSessionCheckIns(sessionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== "staff") {
    redirect("/");
  }

  // Verify session belongs to this staff member
  const { data: session } = await supabase
    .from("sessions")
    .select("staff_user_id")
    .eq("id", sessionId)
    .single();

  if (!session || session.staff_user_id !== user.id) {
    throw new Error("Session not found or access denied");
  }

  // Get check-ins with student information (now stored in the table)
  const { data, error } = await supabase
    .from("checkins")
    .select(
      `
      id,
      session_id,
      student_user_id,
      created_at,
      student_email,
      student_name
    `
    )
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data || []) as CheckIn[];
}
