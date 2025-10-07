import { NextResponse } from "next/server";
import { createClient } from "@utils/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  let next = searchParams.get("next") ?? "/";
  if (!next.startsWith("/")) next = "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.user_metadata?.role) {
        const forwardedHost = request.headers.get("x-forwarded-host");
        const dest = "/onboarding/role";
        if (process.env.NODE_ENV === "development") {
          return NextResponse.redirect(`${origin}${dest}`);
        } else if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}${dest}`);
        } else {
          return NextResponse.redirect(`${origin}${dest}`);
        }
      }

      const forwardedHost = request.headers.get("x-forwarded-host");
      if (process.env.NODE_ENV === "development") {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
