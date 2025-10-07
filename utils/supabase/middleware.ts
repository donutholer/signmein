import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  const isPublic =
    path.startsWith("/signin") ||
    path.startsWith("/auth") ||
    path.startsWith("/error") ||
    path.startsWith("/_next") ||
    path.startsWith("/favicon") ||
    path.startsWith("/api");

  const isOnboarding = path.startsWith("/onboarding/role");

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    return NextResponse.redirect(url);
  }

  if (
    user &&
    !user.user_metadata?.role &&
    !isOnboarding &&
    !path.startsWith("/auth")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/onboarding/role";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
