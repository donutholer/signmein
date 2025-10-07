"use client";

import { useTransition } from "react";
import { chooseRole } from "./actions";

export default function RoleOnboarding() {
  const [pending, start] = useTransition();

  const pick = (role: "student" | "staff") =>
    start(async () => {
      await chooseRole(role);
    });

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-indigo-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-black">
      <div className="w-full max-w-md bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl p-8">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Tell us who you are
        </h1>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          Choose your role to finish setting up your account.
        </p>

        <div className="grid gap-3">
          <button
            disabled={pending}
            onClick={() => pick("student")}
            className="w-full cursor-pointer rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm font-medium shadow-sm hover:shadow-lg transition disabled:opacity-50"
          >
            I{"'"}m a Student
          </button>
          <button
            disabled={pending}
            onClick={() => pick("staff")}
            className="w-full cursor-pointer rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm font-medium shadow-sm hover:shadow-lg transition disabled:opacity-50"
          >
            I{"'"}m Staff
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-6">
          You can change this later in Settings.
        </p>
      </div>
    </main>
  );
}
