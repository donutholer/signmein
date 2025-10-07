import crypto from "crypto";

const getSecret = () => {
  const s = process.env.QR_SECRET;
  if (!s) throw new Error("QR_SECRET is not set");
  return s;
};

export function signQR(uid: string, window: number) {
  return crypto
    .createHmac("sha256", getSecret())
    .update(`${uid}:${window}`)
    .digest("hex");
}

export function verifyQR(uid: string, window: number, sig: string) {
  const expected = signQR(uid, window);
  const okNow = crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  if (okNow) return true;

  const prev = signQR(uid, window - 1);
  const next = signQR(uid, window + 1);
  return (
    crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(prev)) ||
    crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(next))
  );
}

export function currentWindow() {
  return Math.floor(Date.now() / 15000);
}
