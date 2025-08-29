import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export async function createContext() {
  try {
    // Request headers'dan Authorization token'ı al
    const { headers } = await import("next/headers");
    const headersList = await headers();
    const authorizationHeader = headersList.get("authorization");

    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    // Supabase URL'den project ref'i çıkar
    const projectRef =
      process.env.NEXT_PUBLIC_SUPABASE_URL?.split("//")[1]?.split(".")[0];

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

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error("Supabase auth error:", error);
      return { supabase, user: null };
    }

    return { supabase, user };
  } catch (error) {
    console.error("Context creation error:", error);
    return { supabase: null, user: null };
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>;
