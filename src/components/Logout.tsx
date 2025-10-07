"use client";
import { createClient } from "@utils/supabase/client";
import { redirect } from "next/navigation";

export default function LogOut() {
  async function signOut() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error.message);
    }
    redirect("/");
  }

  return (
    <button className="cursor-pointer" onClick={signOut}>
      Log Out
    </button>
  );
}
