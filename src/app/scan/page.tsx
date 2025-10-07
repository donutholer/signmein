"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createSession, endSession, scanAndCheckIn } from "./actions";

type DecodeResponse = Array<{
  type: string;
  symbol: Array<{
    seq: number;
    data: string | null;
    error: string | null;
  }>;
}>;

export default function ScanPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string>("");
  const [active, setActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const inflightRef = useRef<boolean>(false);
  const lastResultRef = useRef<string>("");

  const startSession = () =>
    start(async () => {
      const id = await createSession();
      setSessionId(id);
      setMessage("Session created. Initializing camera…");
      await startCamera();
      setActive(true);
    });

  const finishSession = () =>
    start(async () => {
      if (!sessionId) return;
      await endSession(sessionId);
      setMessage("Session ended.");
      setActive(false);
      stopCamera();
    });

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      step();
    } catch (e: unknown) {
      if (e instanceof Error) {
        setMessage(e.message);
      } else {
        setMessage("Unable to access camera");
      }
    }
  }

  function stopCamera() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const v = videoRef.current;
    const s = v?.srcObject as MediaStream | null;
    s?.getTracks().forEach((t) => t.stop());
    if (v) v.srcObject = null;
  }

  async function tryDecodeFrame() {
    if (!sessionId || inflightRef.current) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c) return;

    const w = 640;
    const h = Math.floor((v.videoHeight / v.videoWidth) * w) || 480;
    c.width = w;
    c.height = h;

    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, w, h);

    inflightRef.current = true;
    const blob: Blob = await new Promise((res) =>
      c.toBlob((b) => res(b!), "image/png")
    );
    const form = new FormData();
    form.append("file", blob, "frame.png");

    try {
      const r = await fetch("https://api.qrserver.com/v1/read-qr-code/", {
        method: "POST",
        body: form,
      });
      const json = (await r.json()) as DecodeResponse;
      const data = json?.[0]?.symbol?.[0]?.data ?? null;
      const err = json?.[0]?.symbol?.[0]?.error ?? null;

      if (err) {
      } else if (data && data !== lastResultRef.current) {
        lastResultRef.current = data;
        try {
          const res = await scanAndCheckIn(data, sessionId);
          if (res.duplicate) setMessage("Already checked in for this session.");
          else setMessage("Checked in!");
        } catch (e: unknown) {
          if (e instanceof Error) {
            setMessage(e.message);
          } else {
            setMessage("Scan failed");
          }
        }
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        setMessage(e.message);
      } else {
        setMessage("Decode error");
      }
    } finally {
      inflightRef.current = false;
    }
  }

  function step() {
    let last = 0;
    const tick = (t: number) => {
      rafRef.current = requestAnimationFrame(tick);
      if (t - last > 1000) {
        last = t;
        void tryDecodeFrame();
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }

  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <main className="min-h-screen p-6 flex flex-col items-center gap-4">
      <h1 className="text-2xl font-semibold">Staff Scanning (GOQR)</h1>

      <div className="flex gap-3">
        <button
          onClick={startSession}
          disabled={pending || !!sessionId}
          className="cursor-pointer rounded-xl border px-4 py-2"
        >
          {pending && !sessionId ? "Creating..." : "Create Session"}
        </button>
        <button
          onClick={finishSession}
          disabled={pending || !sessionId}
          className="cursor-pointer rounded-xl border px-4 py-2"
        >
          {pending && sessionId ? "Ending..." : "End Session"}
        </button>
      </div>

      <p className="text-sm text-slate-600">Session: {sessionId ?? "—"}</p>
      <p className="text-sm">{message}</p>

      <div className="w-full max-w-md rounded-xl overflow-hidden border grid">
        <video
          ref={videoRef}
          playsInline
          muted
          className="w-full h-full bg-black aspect-[3/4] object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {active && (
        <label className="text-xs text-slate-500">
          Trouble scanning? Upload a photo:{" "}
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              if (!sessionId || !e.target.files?.[0]) return;
              const form = new FormData();
              form.append("file", e.target.files[0]);
              try {
                const r = await fetch(
                  "https://api.qrserver.com/v1/read-qr-code/",
                  {
                    method: "POST",
                    body: form,
                  }
                );
                const json = (await r.json()) as DecodeResponse;
                const data = json?.[0]?.symbol?.[0]?.data ?? null;
                if (data) {
                  lastResultRef.current = data;
                  const res = await scanAndCheckIn(data, sessionId);
                  if (res.duplicate)
                    setMessage("Already checked in for this session.");
                  else setMessage("Checked in!");
                } else {
                  setMessage("No code found in image.");
                }
              } catch (err: unknown) {
                if (err instanceof Error) {
                  setMessage(err.message);
                } else {
                  setMessage("Decode error");
                }
              }
            }}
          />
        </label>
      )}
    </main>
  );
}
