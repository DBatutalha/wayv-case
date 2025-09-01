"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [emailExists, setEmailExists] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const router = useRouter();

  // Email kontrolü için debounce fonksiyonu
  useEffect(() => {
    const checkEmail = async () => {
      if (!email || email.length < 3) {
        setEmailExists(false);
        return;
      }

      // Email formatı kontrolü
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setEmailExists(false);
        return;
      }

      setIsCheckingEmail(true);
      setEmailExists(false);

      try {
        // API endpoint ile email kontrolü (tRPC query endpoint)
        const response = await fetch(
          `/api/trpc/users.checkEmail?input=${encodeURIComponent(
            JSON.stringify({ email })
          )}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setEmailExists(data.result?.data?.exists || false);

          if (data.result?.data?.exists) {
            toast.error("Bu email adresi zaten kullanımda!");
          }
        }
      } catch (error) {
        console.error("Email check failed:", error);
      } finally {
        setIsCheckingEmail(false);
      }
    };

    // Debounce: 500ms bekle
    const timeoutId = setTimeout(checkEmail, 500);
    return () => clearTimeout(timeoutId);
  }, [email]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Şifreler eşleşmiyor");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır");
      setIsLoading(false);
      return;
    }

    if (emailExists) {
      setError("Bu email adresi zaten kullanımda");
      toast.error("Bu email adresi zaten kullanımda");
      setIsLoading(false);
      return;
    }

    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (!error && authData.user) {
      // User'ı veritabanına kaydet
      try {
        const userData = {
          id: authData.user.id,
          email: authData.user.email!,
        };

        const userResponse = await fetch("/api/trpc/users.create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        });

        if (userResponse.ok) {
          setSuccess(
            "Hesap başarıyla oluşturuldu! Lütfen email adresinizi kontrol ederek hesabınızı doğrulayın."
          );
          toast.success(
            "Hesap başarıyla oluşturuldu! Email adresinizi kontrol edin."
          );
          setTimeout(() => {
            router.push("/login");
          }, 2000);
        } else {
          const errorData = await userResponse.json();
          console.error("User database save failed:", errorData);
          setError(
            "Hesap oluşturuldu ancak veritabanına kaydedilemedi. Lütfen tekrar deneyin."
          );
          toast.error(
            "Hesap oluşturuldu ancak veritabanına kaydedilemedi. Lütfen tekrar deneyin."
          );
        }
      } catch (dbError) {
        console.error("Database error:", dbError);
        setError(
          "Hesap oluşturuldu ancak veritabanına kaydedilemedi. Lütfen tekrar deneyin."
        );
        toast.error(
          "Hesap oluşturuldu ancak veritabanına kaydedilemedi. Lütfen tekrar deneyin."
        );
      }
    } else {
      setError(error?.message || "Hesap oluşturulurken hata oluştu");
      toast.error(error?.message || "Hesap oluşturulurken hata oluştu");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Campaign Management
            </h1>
          </Link>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Create Account
          </h2>
          <p className="text-gray-600">
            Join us to start managing your campaigns
          </p>
        </div>

        {/* Signup Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSignUp} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
                {success}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500 ${
                    emailExists
                      ? "border-red-500 focus:ring-red-500"
                      : isCheckingEmail
                      ? "border-yellow-500 focus:ring-yellow-500"
                      : "border-gray-300"
                  }`}
                  required
                  disabled={isCheckingEmail}
                />
                {isCheckingEmail && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  </div>
                )}
                {emailExists && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <svg
                      className="w-5 h-5 text-red-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </div>
                )}
              </div>
              {isCheckingEmail && (
                <p className="text-sm text-blue-600 mt-1 flex items-center">
                  <svg
                    className="w-4 h-4 mr-1 animate-spin"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Email kontrol ediliyor...
                </p>
              )}
              {emailExists && (
                <p className="text-sm text-red-600 mt-1 flex items-center">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Bu email adresi zaten kullanımda
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password (min. 6 characters)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || isCheckingEmail || emailExists}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link href="/" className="text-gray-600 hover:text-gray-800 text-sm">
            ← Back to Home
          </Link>
        </div>
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            duration: 3000,
            style: {
              background: "#10B981",
            },
          },
          error: {
            duration: 5000,
            style: {
              background: "#EF4444",
            },
          },
        }}
      />
    </div>
  );
}
