import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Refreshes the Supabase session on every /suite request and keeps signed-out
// visitors out of the suite. Access control still comes from RLS and the
// database functions. This check only decides which page the visitor sees.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginPage = request.nextUrl.pathname === "/suite/login";

  if (!user && !isLoginPage) {
    return NextResponse.redirect(new URL("/suite/login", request.url));
  }

  if (user && isLoginPage) {
    return NextResponse.redirect(new URL("/suite", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/suite/:path*"],
};
