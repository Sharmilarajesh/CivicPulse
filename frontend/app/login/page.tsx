"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import { ButtonSpinner } from "@/components/LoadingSpinner";
import { getRedirectPath } from "@/types";

export default function Login() {
  const router = useRouter();
  const { user, login } = useAuth();
  
  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push(getRedirectPath(user.role));
    }
  }, [user, router]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data } = await api.post("/auth/login", { email, password });
      const { token, user, redirectTo } = data;

      login(token, user, redirectTo);

      router.push(redirectTo || getRedirectPath(user.role));
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen md:h-screen flex flex-col md:flex-row bg-content-bg fade-in md:overflow-hidden">
      {/* LEFT PANEL */}
      <div className="w-full md:w-[45%] bg-sidebar-bg text-white p-10 md:p-12 flex flex-col justify-center gap-7 relative overflow-hidden min-h-screen md:h-screen">
        {/* Animated Particles */}
        <div className="absolute top-[20%] left-[10%] w-2 h-2 bg-blue-500 rounded-full pulse-dot"></div>
        <div
          className="absolute bottom-[30%] right-[20%] w-3 h-3 bg-cyan-400 rounded-full pulse-dot"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-[60%] left-[30%] w-1.5 h-1.5 bg-amber-400 rounded-full pulse-dot"
          style={{ animationDelay: "0.5s" }}
        ></div>

        <div className="absolute top-10 left-10 md:left-12 z-20">
          <Link href="/" className="inline-flex items-center gap-2 text-text-muted hover:text-white transition-colors group">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Home</span>
          </Link>
        </div>

        <div className="relative z-10 fade-up mt-8 md:mt-12">
          <div className="mb-4">
            <Link href="/" className="inline-block group">
              <span className="text-3xl font-bold tracking-tight text-white group-hover:scale-105 transition-transform inline-block">
                Civic<span className="text-cyan-500">Pulse</span>
              </span>
            </Link>
          </div>

          <h1 className="text-4xl font-bold mb-6">Welcome Back</h1>
          <p className="text-text-muted mb-12 text-lg">
            Sign in to continue making your neighborhood a better place.
          </p>

          <div className="space-y-6">
            {[
              "Track your reported issues",
              "Connect with local authorities",
              "Get real-time updates",
            ].map((feature, i) => (
              <div
                key={i}
                className="flex items-center gap-4 fade-up"
                style={{ animationDelay: `${(i + 2) * 0.1}s` }}
              >
                <CheckCircle2 className="text-green-400 shrink-0" />
                <span className="text-border font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full md:w-[55%] flex flex-col items-center justify-center p-6 md:p-8 min-h-screen md:h-screen overflow-y-auto">
        <div
          className="w-full max-w-110 card p-8 fade-up"
          style={{ animationDelay: "0.2s" }}
        >
          <h2 className="text-3xl font-bold mb-2">
            Sign In <span className="gradient-text">Securely</span>
          </h2>
          <p className="text-slate-500 mb-8">
            Enter your credentials to access your account.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 shake">
                <AlertCircle size={18} />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-semibold text-slate-700">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-12 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 bg-primary hover:bg-primary-dark hover:scale-[1.02] hover:shadow-lg text-white font-bold rounded-xl transition-all duration-200 disabled:opacity-70 disabled:hover:scale-100 mt-5"
            >
              {loading ? <ButtonSpinner /> : "Sign In"}
            </button>
          </form>

          <p className="mt-8 text-center text-slate-500 text-sm font-medium">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="text-blue-600 hover:text-blue-700 hover:underline"
            >
              Register now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
