import OneTapComponent from "@/components/GoogleOneTap";
import LogOut from "@/components/Logout";
import StudentQR from "@/components/StudentQR";
import { createClient } from "@utils/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data.user && !data.user.user_metadata?.role) {
    redirect("/onboarding/role");
  }

  const role = data.user?.user_metadata?.role as
    | "staff"
    | "student"
    | undefined;

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-6 row-start-2 items-center sm:items-start">
        {data.user ? (
          <>
            <h1 className="text-2xl font-semibold text-gray-700">
              Welcome, {data.user.email?.split("@")[0] ?? "user"}!
            </h1>

            {role === "staff" ? (
              <Link
                href="/scan"
                className="cursor-pointer inline-flex items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium shadow-sm hover:shadow"
              >
                Open Scanner
              </Link>
            ) : role === "student" ? (
              <div className="flex flex-col gap-3">
                <p className="text-slate-600">
                  Show this QR to staff to check in:
                </p>
                <StudentQR />
              </div>
            ) : null}

            <LogOut />
          </>
        ) : (
          <>
            <OneTapComponent />
            <Link
              href="/signin"
              className="inline-flex text-gray-800 items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium shadow-sm hover:shadow transition"
            >
              Sign in with Google
            </Link>
          </>
        )}
      </main>
    </div>
  );
}
