"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createSession, endSession, scanAndCheckIn } from "./actions";
import { signOut } from "@/app/actions";
import jsQR from "jsqr";

export default function ScanPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string>("");
  const [active, setActive] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string | undefined>(undefined);
  const [checkInCount, setCheckInCount] = useState<number>(0);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [lastQRDetected, setLastQRDetected] = useState<string>("");
  const [scanAttempts, setScanAttempts] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const inflightRef = useRef<boolean>(false);
  const lastResultRef = useRef<string>("");
  const lastResultTimeRef = useRef<number>(0);
  const scanCountRef = useRef<number>(0);
  const sessionIdRef = useRef<string | null>(null);

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
      console.log("Session created with ID:", id);
      setSessionId(id);
      sessionIdRef.current = id; // Also set the ref for immediate availability
      setCheckInCount(0);
      setActive(true); // Set active BEFORE starting camera so video element is mounted
      setMessage("Session created. Initializing camera…");
      // Wait for next tick to ensure video element is rendered
      await new Promise((resolve) => setTimeout(resolve, 100));
      await startCamera();
    });

  const finishSession = () =>
    start(async () => {
      if (!sessionId) return;
      await endSession(sessionId);
      setMessage(`Session ended. Total check-ins: ${checkInCount}`);
      setActive(false);
      stopCamera();
      setSessionId(null);
      sessionIdRef.current = null;
    });

  async function startCamera() {
    try {
      console.log("Starting camera...");
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
      console.log("Got media stream:", stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // Wait for video metadata to load
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              console.log("Video metadata loaded");
              resolve();
            };
          }
        });

        await videoRef.current.play();
        console.log("Video playing, dimensions:", videoRef.current.videoWidth, "x", videoRef.current.videoHeight);
        setMessage("Camera ready. Scanning for QR codes...");
      } else {
        throw new Error("Video element not available");
      }
      console.log("Calling step() to start scanning loop...");
      step();
    } catch (e: unknown) {
      if (e instanceof Error) {
        if (e.name === "NotAllowedError") {
          setMessage("❌ Camera permission denied. Please allow camera access.");
        } else if (e.name === "NotFoundError") {
          setMessage("❌ No camera found. Please connect a camera.");
        } else if (e.name === "NotReadableError") {
          setMessage("❌ Camera is already in use by another application.");
        } else {
          setMessage(`❌ Camera error: ${e.message}`);
        }
      } else {
        setMessage("❌ Unable to access camera");
      }
      setActive(false);
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
    const currentSessionId = sessionIdRef.current;
    if (!currentSessionId) {
      console.log("tryDecodeFrame: no sessionId");
      return;
    }
    if (inflightRef.current) {
      console.log("tryDecodeFrame: inflight request");
      return;
    }
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c) {
      console.log("tryDecodeFrame: no video or canvas ref", { v: !!v, c: !!c });
      return;
    }

    const vw = v.videoWidth;
    const vh = v.videoHeight;

    if (vw === 0 || vh === 0) {
      console.log("tryDecodeFrame: video dimensions are 0", { vw, vh });
      return;
    }

    const ctx = c.getContext("2d");
    if (!ctx) return;

    c.width = vw;
    c.height = vh;
    ctx.drawImage(v, 0, 0, vw, vh);

    const imageData = ctx.getImageData(0, 0, vw, vh);

    // Update scanning indicator and counter
    scanCountRef.current += 1;
    if (scanCountRef.current % 4 === 0) {
      setIsScanning((prev) => !prev);
      setScanAttempts(scanCountRef.current);
    }

    // Log first few attempts
    if (scanCountRef.current <= 5) {
      console.log("Calling jsQR with image:", vw, "x", vh, "pixels");
    }

    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "attemptBoth",
    });

    // Log detection attempts
    if (scanCountRef.current % 20 === 0) {
      console.log("jsQR scan attempt #", scanCountRef.current, "- Result:", code ? "QR FOUND" : "no QR");
    }

    if (code && code.data) {
      const now = Date.now();
      const data = code.data;

      console.log("QR Code detected:", data);
      setLastQRDetected(data);

      // Prevent duplicate scans within 3 seconds
      if (
        data === lastResultRef.current &&
        now - lastResultTimeRef.current < 3000
      ) {
        console.log("Duplicate scan prevented (within 3 seconds)");
        return;
      }

      if (data !== lastResultRef.current) {
        lastResultRef.current = data;
        lastResultTimeRef.current = now;
        inflightRef.current = true;

        console.log("Processing check-in for:", data, "with session:", currentSessionId);

        try {
          const res = await scanAndCheckIn(data, currentSessionId);
          console.log("Check-in response:", res);
          if (res.duplicate) {
            setMessage("⚠️ Already checked in for this session.");
          } else {
            setCheckInCount((prev) => prev + 1);
            setMessage("✅ Checked in successfully!");
            // Clear message after 2 seconds
            setTimeout(() => {
              setMessage("Ready to scan...");
            }, 2000);
          }
        } catch (e: unknown) {
          console.error("Check-in error:", e);
          if (e instanceof Error) {
            setMessage(`❌ Error: ${e.message}`);
          } else {
            setMessage("❌ Scan failed");
          }
          // Clear error message after 3 seconds
          setTimeout(() => {
            setMessage("Ready to scan...");
          }, 3000);
        } finally {
          inflightRef.current = false;
        }
      }
    }
  }

  function step() {
    console.log("step() called - starting RAF loop");
    let last = 0;
    let loopCount = 0;
    const tick = (t: number) => {
      rafRef.current = requestAnimationFrame(tick);
      loopCount++;
      if (loopCount === 1) {
        console.log("RAF loop first tick");
      }
      // Scan every 250ms for more responsive detection
      if (t - last > 250) {
        last = t;
        if (loopCount % 20 === 0) {
          console.log("RAF loop still running, calling tryDecodeFrame...");
        }
        void tryDecodeFrame();
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }

  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <main className="min-h-screen p-6 flex flex-col items-center gap-6 bg-white dark:bg-neutral-950">
      <div className="max-w-2xl w-full space-y-6">
        <div className="flex justify-between items-start">
          <div className="text-center flex-1">
            <h1 className="text-3xl font-semibold text-neutral-950 dark:text-neutral-50">
              Staff Scanning
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-2">
              Scan student QR codes to check them in
            </p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm font-medium border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
            >
              Sign Out
            </button>
          </form>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={startSession}
            disabled={pending || !!sessionId}
            className="px-6 py-3 rounded-lg font-medium border border-neutral-200 dark:border-neutral-800 bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {pending && !sessionId ? "Creating..." : "Create Session"}
          </button>
          <button
            onClick={finishSession}
            disabled={pending || !sessionId}
            className="px-6 py-3 rounded-lg font-medium border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-950 dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {pending && sessionId ? "Ending..." : "End Session"}
          </button>
        </div>

        <div className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Session ID
              </p>
              <p className="font-mono text-sm text-neutral-950 dark:text-neutral-50">
                {sessionId ?? "—"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Check-ins
              </p>
              <p className="text-2xl font-semibold text-neutral-950 dark:text-neutral-50">
                {checkInCount}
              </p>
            </div>
          </div>
          {message && (
            <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800">
              <p className="text-sm text-center text-neutral-700 dark:text-neutral-300">
                {message}
              </p>
            </div>
          )}
        </div>

        {devices.length > 1 && active && (
          <div className="flex items-center justify-center gap-3 text-sm">
            <span className="text-neutral-600 dark:text-neutral-400">
              Camera:
            </span>
            <select
              value={deviceId ?? ""}
              onChange={(e) => setDeviceId(e.target.value || undefined)}
              className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-950 dark:text-neutral-50 rounded-lg px-3 py-1.5"
            >
              <option value="">Auto</option>
              {devices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Camera ${d.deviceId.slice(0, 6)}…`}
                </option>
              ))}
            </select>
            <button
              className="border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-1.5 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
              onClick={async () => {
                stopCamera();
                await startCamera();
              }}
            >
              Switch
            </button>
          </div>
        )}

        {active && (
          <div className="space-y-4">
            <div className="relative w-full rounded-2xl overflow-hidden border-4 border-neutral-200 dark:border-neutral-800 shadow-lg">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full bg-black aspect-[3/4] object-cover"
              />
              <div className="absolute top-4 left-4 right-4">
                <div className="bg-black/50 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-xs text-center flex items-center justify-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isScanning ? "bg-green-400" : "bg-green-600"
                    } transition-colors`}
                  />
                  Position QR code within the frame
                </div>
              </div>
            </div>
            <div className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800">
              <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Scanner Preview
              </h3>
              <canvas
                ref={canvasRef}
                className="w-full border border-neutral-200 dark:border-neutral-800 rounded"
              />
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2">
                This shows what the scanner sees (processed image)
              </p>
            </div>
          </div>
        )}

        {!active && sessionId && (
          <div className="text-center text-neutral-600 dark:text-neutral-400 py-12">
            <p>Camera is initializing...</p>
          </div>
        )}

        {active && (
          <div className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800">
            <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
              Debug Info
            </h3>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-neutral-600 dark:text-neutral-400">
                  Scan attempts:
                </span>
                <span className="text-neutral-950 dark:text-neutral-50">
                  {scanAttempts}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600 dark:text-neutral-400">
                  Scanning:
                </span>
                <span className="text-neutral-950 dark:text-neutral-50">
                  {isScanning ? "●" : "○"}
                </span>
              </div>
              {lastQRDetected && (
                <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                  <p className="text-neutral-600 dark:text-neutral-400 mb-1">
                    Last QR detected:
                  </p>
                  <p className="text-neutral-950 dark:text-neutral-50 break-all">
                    {lastQRDetected}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <label className="block">
                <span className="text-xs text-neutral-600 dark:text-neutral-400 mb-2 block">
                  Test with screenshot/photo:
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="text-xs"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !sessionIdRef.current) return;

                    const img = new Image();
                    img.onload = async () => {
                      const canvas = document.createElement("canvas");
                      canvas.width = img.width;
                      canvas.height = img.height;
                      const ctx = canvas.getContext("2d");
                      if (!ctx) return;

                      ctx.drawImage(img, 0, 0);
                      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

                      console.log("Testing uploaded image:", canvas.width, "x", canvas.height);
                      const code = jsQR(imageData.data, imageData.width, imageData.height, {
                        inversionAttempts: "attemptBoth",
                      });

                      if (code && code.data) {
                        console.log("QR found in uploaded image:", code.data);
                        setLastQRDetected(code.data);
                        try {
                          const res = await scanAndCheckIn(code.data, sessionIdRef.current!);
                          if (res.duplicate) {
                            setMessage("⚠️ Already checked in for this session.");
                          } else {
                            setCheckInCount((prev) => prev + 1);
                            setMessage("✅ Checked in successfully!");
                          }
                        } catch (err) {
                          console.error("Check-in error:", err);
                          setMessage(`❌ ${err instanceof Error ? err.message : "Scan failed"}`);
                        }
                      } else {
                        console.log("No QR code found in uploaded image");
                        setMessage("❌ No QR code found in image");
                      }
                    };
                    img.src = URL.createObjectURL(file);
                  }}
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
