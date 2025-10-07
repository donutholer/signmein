"use client";

import { useEffect, useState } from "react";
import { issueStudentQR } from "@/app/scan/actions";
import Image from "next/image";

export default function StudentQR() {
  const [payload, setPayload] = useState<string>("");

  useEffect(() => {
    let alive = true;

    const tick = async () => {
      try {
        const p = await issueStudentQR();
        if (alive) setPayload(p);
      } catch (e) {
        console.error(e);
      }
    };

    tick();
    const id = setInterval(tick, 12_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const src = payload
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
        payload
      )}`
    : "";

  return (
    <div className="flex flex-col items-center gap-2">
      {payload ? (
        <>
          <Image
            src={src}
            width={220}
            height={220}
            alt="Your check-in QR"
            className="rounded-lg border"
          />
          <p className="text-xs text-slate-500 text-center">
            Rotates every ~15s
          </p>
        </>
      ) : (
        <div className="w-[220px] h-[220px] grid place-items-center border rounded-lg text-slate-400">
          Generating…
        </div>
      )}
    </div>
  );
}
