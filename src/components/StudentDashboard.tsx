"use client";

import { useEffect, useState } from "react";
import { issueStudentQR } from "@/app/scan/actions";
import Image from "next/image";

interface StudentDashboardProps {
  userId: string;
  userName: string;
}

export default function StudentDashboard({ userId, userName }: StudentDashboardProps) {
  const [qrPayload, setQrPayload] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(15);

  useEffect(() => {
    let alive = true;
    let countdownInterval: NodeJS.Timeout;

    const generateQR = async () => {
      try {
        const payload = await issueStudentQR();
        if (alive) {
          setQrPayload(payload);
          setTimeLeft(15);
        }
      } catch (e) {
        console.error("Failed to generate QR:", e);
      }
    };

    // Generate initial QR
    generateQR();

    // // Set up countdown
    // countdownInterval = setInterval(() => {
    //   setTimeLeft((prev) => {
    //     if (prev <= 1) {
    //       generateQR();
    //       return 15;
    //     }
    //     return prev - 1;
    //   });
    // }, 1000);

    // // Regenerate every 15 seconds
    // const regenerateInterval = setInterval(generateQR, 15000);

    // return () => {
    //   alive = false;
    //   clearInterval(countdownInterval);
    //   clearInterval(regenerateInterval);
    // };
  }, []);

  const qrImageUrl = qrPayload
    ? `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(qrPayload)}`
    : "";

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      <div className="w-full max-w-md">
        {/* QR Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Your Attendance QR
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Show this code to your instructor
            </p>
          </div>

          {/* QR Code Display */}
          <div className="flex flex-col items-center gap-4">
            {qrPayload ? (
              <>
                <div className="relative">
                  <Image
                    src={qrImageUrl}
                    width={280}
                    height={280}
                    alt="Attendance QR Code"
                    className="rounded-xl border-2 border-slate-200 dark:border-slate-700"
                  />
                  {/* Countdown Badge */}
                  {/* <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-700 rounded-full px-3 py-1 shadow-lg border border-slate-200 dark:border-slate-600">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Refreshes in {timeLeft}s
                    </span>
                  </div> */}
                </div>
              </>
            ) : (
              <div className="w-[280px] h-[280px] rounded-xl border-2 border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center">
                <svg className="animate-spin h-8 w-8 text-slate-400 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-sm text-slate-500">Generating QR Code...</p>
              </div>
            )}
          </div>

          {/* Status Indicator */}
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <p className="text-sm font-medium text-green-800 dark:text-green-300">
                Ready for attendance check
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}