"use client";

import { useEffect, useState } from "react";
import { issueStudentQR } from "./actions";
import { signOut } from "@/app/actions";
import QRCode from "qrcode";

export default function StudentPage() {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    let intervalId: NodeJS.Timeout;

    async function generateQR() {
      try {
        const payload = await issueStudentQR();
        if (!mounted) return;

        const dataUrl = await QRCode.toDataURL(payload, {
          width: 300,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        });

        if (mounted) {
          setQrDataUrl(dataUrl);
          setError("");
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to generate QR");
        }
      }
    }

    // Generate initial QR
    void generateQR();

    // Refresh every 10 seconds (QR expires after 45 seconds, so this keeps it fresh)
    intervalId = setInterval(() => {
      void generateQR();
    }, 10000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-white dark:bg-neutral-950">
      <div className="max-w-md w-full space-y-6">
        <div className="flex justify-end mb-4">
          <form action={signOut}>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm font-medium border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
            >
              Sign Out
            </button>
          </form>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold text-neutral-950 dark:text-neutral-50">
            Your QR Code
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Show this code to your instructor to check in
          </p>
        </div>

        <div className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl p-8 border border-neutral-200 dark:border-neutral-800">
          {error ? (
            <div className="text-center space-y-3">
              <div className="w-full aspect-square rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          ) : qrDataUrl ? (
            <div className="flex justify-center">
              <img
                src={qrDataUrl}
                alt="Student QR Code"
                className="w-full max-w-[300px] rounded-xl"
              />
            </div>
          ) : (
            <div className="w-full aspect-square rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
          )}
        </div>

        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Auto-refreshing every 10 seconds
            </p>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-500">
            Keep this screen open during class
          </p>
        </div>
      </div>
    </main>
  );
}
