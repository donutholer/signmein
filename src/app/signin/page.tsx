"use client";

import Image from "next/image";
import { useTransition } from "react";
import { signInWithGoogle } from "./actions";

export default function Signin() {
  const [isPending, startTransition] = useTransition();

  const handleGoogle = () => {
    startTransition(async () => {
      await signInWithGoogle();
    });
  };
  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-black flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-900/80 shadow-2xl rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 backdrop-blur">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-2xl bg-slate-900 dark:bg-white flex items-center justify-center shadow-sm">
              <span className="text-white dark:text-slate-900 font-bold">
                SMI
              </span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Welcome back
            </h1>
          </div>

          <p className="text-slate-600 dark:text-slate-300 mb-6">
            Sign in to continue.
          </p>

          <button
            onClick={handleGoogle}
            disabled={isPending}
            className="group w-full inline-flex items-center cursor-pointer justify-center gap-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm font-medium shadow-sm hover:shadow-lg transition active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-indigo-500/60 dark:focus:ring-indigo-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Image
              alt="Google"
              src="https://www.google.com/favicon.ico"
              width={18}
              height={18}
            />
            <span className="text-slate-800 dark:text-slate-100">
              {isPending ? "Redirecting…" : "Continue with Google"}
            </span>
          </button>

          <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            By continuing, you agree to our Terms and acknowledge our Privacy
            Policy.
          </p>
        </div>
      </div>
    </main>
  );
}
