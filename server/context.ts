import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export async function createContext() {
  try {
    console.log("=== CONTEXT CREATION START ===");
    console.log("Environment variables check:");
    console.log("SUPABASE_URL exists:", !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log(
      "SUPABASE_ANON_KEY exists:",
      !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Request headers'dan Authorization token'ı al
    const { headers } = await import("next/headers");
    const headersList = await headers();
    const authorizationHeader = headersList.get("authorization");
    console.log("Authorization header exists:", !!authorizationHeader);
    if (authorizationHeader) {
      console.log(
        "Authorization header value:",
        authorizationHeader.substring(0, 50) + "..."
      );
    }

    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();
    console.log("Cookie store created, cookies:", cookieHeader);

    // Tüm cookie'leri listele
    const allCookies = cookieStore.getAll();
    console.log(
      "All cookies:",
      allCookies.map((c) => ({
        name: c.name,
        value: c.value.substring(0, 20) + "...",
        fullValue: c.value,
      }))
    );

    // Supabase URL'den project ref'i çıkar
    const projectRef =
      process.env.NEXT_PUBLIC_SUPABASE_URL?.split("//")[1]?.split(".")[0];
    console.log("Project ref from URL:", projectRef);

    // Olası Supabase cookie isimlerini listele
    const possibleCookieNames = [
      "sb-access-token",
      "sb-refresh-token",
      "supabase-access-token",
      "supabase-refresh-token",
      "access_token",
      "refresh_token",
      `sb-${projectRef}-auth-token`,
      `sb-${projectRef}-access-token`,
      `sb-${projectRef}-refresh-token`,
    ];

    console.log("Checking for cookies:", possibleCookieNames);
    possibleCookieNames.forEach((name) => {
      const cookie = cookieStore.get(name);
      if (cookie) {
        console.log(
          `Found cookie ${name}:`,
          cookie.value.substring(0, 50) + "..."
        );
      }
    });

    // Supabase session token'ını bul (önce Authorization header, sonra cookie'ler)
    const supabaseAccessToken =
      authorizationHeader?.replace("Bearer ", "") ||
      cookieStore.get("sb-access-token")?.value ||
      cookieStore.get("supabase-access-token")?.value ||
      cookieStore.get("access_token")?.value ||
      cookieStore.get(
        "sb-" +
          process.env.NEXT_PUBLIC_SUPABASE_URL?.split("//")[1]?.split(".")[0] +
          "-auth-token"
      )?.value ||
      cookieStore.get(
        "sb-" +
          process.env.NEXT_PUBLIC_SUPABASE_URL?.split("//")[1]?.split(".")[0] +
          "-access-token"
      )?.value;

    const supabaseRefreshToken =
      cookieStore.get("sb-refresh-token")?.value ||
      cookieStore.get("supabase-refresh-token")?.value ||
      cookieStore.get("refresh_token")?.value ||
      cookieStore.get(
        "sb-" +
          process.env.NEXT_PUBLIC_SUPABASE_URL?.split("//")[1]?.split(".")[0] +
          "-refresh-token"
      )?.value;

    console.log("Supabase tokens found:", {
      accessToken: !!supabaseAccessToken,
      refreshToken: !!supabaseRefreshToken,
    });

    console.log("Creating Supabase client with:");
    console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log(
      "ANON_KEY exists:",
      !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    console.log("Access token exists:", !!supabaseAccessToken);
    console.log("Refresh token exists:", !!supabaseRefreshToken);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Cookie: cookieHeader,
            Authorization: supabaseAccessToken
              ? `Bearer ${supabaseAccessToken}`
              : "",
          },
        },
      }
    );
    console.log("Supabase client created");

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error("Supabase auth error:", error);
      return { supabase, user: null };
    }

    console.log("User authenticated:", user?.id);
    return { supabase, user };
  } catch (error) {
    console.error("Context creation error:", error);
    return { supabase: null, user: null };
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>;
