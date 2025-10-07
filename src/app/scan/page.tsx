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
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string | undefined>(undefined);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const inflightRef = useRef<boolean>(false);
  const lastResultRef = useRef<string>("");

  async function listCams() {
    const all = await navigator.mediaDevices.enumerateDevices();
    setDevices(all.filter((d) => d.kind === "videoinput"));
  }

  useEffect(() => {
    async function fetchDevices() {
      if (navigator.mediaDevices.enumerateDevices) {
        await navigator.mediaDevices.enumerateDevices();
        await listCams();
      }
    }
    fetchDevices();
  }, []);

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
      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? {
              deviceId: { exact: deviceId },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            }
          : {
              facingMode: { ideal: "environment" },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
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

    const vw = v.videoWidth,
      vh = v.videoHeight;
    const side = Math.min(vw, vh);
    const sx = Math.floor((vw - side) / 2);
    const sy = Math.floor((vh - side) / 2);

    const ctx = c.getContext("2d");
    if (!ctx) return;
    const OUT = 1080;
    c.width = OUT;
    c.height = OUT;
    ctx.drawImage(v, sx, sy, side, side, 0, 0, OUT, OUT);

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

      {devices.length > 1 && (
        <div className="flex items-center gap-2 text-sm">
          <span>Camera:</span>
          <select
            value={deviceId ?? ""}
            onChange={(e) => setDeviceId(e.target.value || undefined)}
            className="border rounded px-2 py-1"
          >
            <option value="">Auto</option>
            {devices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `Camera ${d.deviceId.slice(0, 6)}…`}
              </option>
            ))}
          </select>
          <button
            className="border rounded px-2 py-1"
            onClick={async () => {
              stopCamera();
              await startCamera();
            }}
          >
            Switch
          </button>
        </div>
      )}
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
