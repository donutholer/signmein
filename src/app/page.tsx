<<<<<<< Updated upstream
import OneTapComponent from "@/components/GoogleOneTap";
import { createClient } from "@utils/supabase/server";
import Link from "next/link";
// import Image from "next/image";
=======
import { createClient } from "@utils/supabase/server";
import { redirect } from "next/navigation";
import StudentDashboard from "@/components/StudentDashboard";
import StaffDashboard from "@/components/StaffDashboard";
>>>>>>> Stashed changes

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

<<<<<<< Updated upstream
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        {data.user ? (
          <div className="flex flex-col gap-4 items-center">
            <h1 className="text-2xl font-semibold text-gray-400">
              Welcome,{" "}
              {data.user.email
                ? data.user.email.split("@")[0]
                : data.user.user_metadata.full_name}
              !
            </h1>
          </div>
        ) : (
          <>
            <OneTapComponent />
            <Link
              href="/signin"
              className="inline-flex text-gray-800 items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium shadow-sm hover:shadow transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sign in with Google
            </Link>
          </>
=======
  // Redirect unauthenticated users to sign-in
  if (!user) {
    redirect("/signin");
  }

  // Redirect users without a role to onboarding
  if (!user.user_metadata?.role) {
    redirect("/onboarding/role");
  }

  const role = user.user_metadata.role as "staff" | "student";
  const userName = user.user_metadata.full_name || user.email?.split("@")[0] || "User";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg">QR</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Attendance System
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Welcome back, {userName}
                </p>
              </div>
            </div>
            
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="text-sm px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {role === "student" ? (
          <StudentDashboard userId={user.id} userName={userName} />
        ) : (
          <StaffDashboard userId={user.id} userName={userName} />
>>>>>>> Stashed changes
        )}
      </main>
    </div>
  );
}