import { NextResponse } from "next/server";
export const runtime = "edge";

export async function POST(req: Request) {
  const form = await req.formData();
  const r = await fetch("https://api.qrserver.com/v1/read-qr-code/", {
    method: "POST",
    body: form,
  });
  const text = await r.text();
  return new NextResponse(text, {
    status: r.status,
    headers: {
      "content-type": r.headers.get("content-type") ?? "application/json",
    },
  });
}
