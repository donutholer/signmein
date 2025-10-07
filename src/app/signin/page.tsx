"use client";

import Image from "next/image";
import { useTransition } from "react";
import { signInWithGoogle } from "./actions";
import OneTapComponent from "@/components/GoogleOneTap";

export default function SignIn() {
  const [isPending, startTransition] = useTransition();

  const handleGoogleSignIn = () => {
    startTransition(async () => {
      await signInWithGoogle();
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-indigo-950 dark:to-purple-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-8 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <span className="text-white font-bold text-xl">QR</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold">Welcome</h1>
                <p className="text-white/80 text-sm">Attendance Tracking System</p>
              </div>
            </div>
            <p className="text-white/90">
              Quick and easy attendance management for students and staff
            </p>
          </div>

          {/* Sign In Section */}
          <div className="p-8">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">
              Sign in to your account
            </h2>

            {/* Google One-Tap (invisible component) */}
            <OneTapComponent />

            {/* Primary Sign-In Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isPending}
              className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-100 shadow-sm hover:shadow-lg hover:border-slate-400 dark:hover:border-slate-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-slate-600 dark:text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Redirecting...</span>
                </>
              ) : (
                <>
                  <Image
                    alt="Google"
                    src="https://www.google.com/favicon.ico"
                    width={20}
                    height={20}
                    className="w-5 h-5"
                  />
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            {/* Features List */}
            <div className="mt-8 space-y-3">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">For Students</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Generate QR codes for quick check-in</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">For Staff</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Scan and track student attendance</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            {/* <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p> */}
          </div>
        </div>
      </div>
    </main>
  );
}