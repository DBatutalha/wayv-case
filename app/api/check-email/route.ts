import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Email formatı kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Supabase client oluştur (anon key ile)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Email kontrolü - signUp ile test et (hata alırsak email var demektir)
    const { error } = await supabase.auth.signUp({
      email,
      password: "temp_password_for_check",
    });

    // Eğer "User already registered" hatası alırsak, email zaten var
    const userExists =
      error?.message?.includes("already registered") ||
      error?.message?.includes("already been registered");

    return NextResponse.json({
      exists: userExists,
      message: userExists ? "Email already exists" : "Email available",
    });
  } catch (error) {
    console.error("Email check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
