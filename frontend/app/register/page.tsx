"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getRedirectPath } from '@/types';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Building2,
  UserPlus,
  Info,
  Quote,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import { ButtonSpinner } from "@/components/LoadingSpinner";

export default function Register() {
  const router = useRouter();
  const { user, login } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push(getRedirectPath(user.role));
    }
  }, [user, router]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getStrength = (pass: string) => {
    let score = 0;
    if (pass.length > 5) score += 1;
    if (pass.length > 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };
  const strength = getStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.post("/auth/register", {
        name,
        email,
        password,
      });
      const { token, user, redirectTo } = data;

      login(token, user, redirectTo);

      router.push(redirectTo || "/my-reports");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to register");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen md:h-screen flex flex-col md:flex-row bg-content-bg fade-in md:overflow-hidden">
      {/* LEFT PANEL */}
      <div className="w-full md:w-[45%] bg-sidebar-bg text-white p-10 md:p-12 flex flex-col justify-center gap-7 relative overflow-hidden min-h-screen md:h-screen">
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

        {/* 1. Logo */}
        <div className="relative z-10 fade-up mb-0 mt-8 md:mt-12">
          <Link href="/" className="inline-block mb-2 group">
            <span className="text-3xl font-bold tracking-tight text-white group-hover:scale-105 transition-transform inline-block">
              Civic<span className="text-cyan-500">Pulse</span>
            </span>
          </Link>
        </div>

        {/* 2. Heading */}
        <div className="relative z-10 fade-up mb-0">
          <h1 className="text-4xl font-bold mb-4">Create Account</h1>
          <p className="text-text-muted text-lg">
            Join the community and take part in improving local infrastructure.
          </p>
        </div>

        {/* 3. Testimonial */}
        <div className="relative z-10 bg-white/10 border border-white/20 rounded-xl p-8 fade-up mb-0">
          <Quote className="w-8 h-8 text-cyan-400 mb-3" />
          <p className="text-border font-medium leading-relaxed italic text-lg">
            "CivicPulse empowered our neighborhood to fix a 6-month old pothole
            in just two weeks!"
          </p>
          <p className="text-text-muted text-sm mt-4 font-bold">
            — Local Resident
          </p>
        </div>

        {/* 4. Officer/Admin Info Box */}
        <div className="relative z-10 rounded-xl p-5 border border-[rgba(6,182,212,0.3)] bg-[rgba(6,182,212,0.15)] fade-up mb-0">
          <div className="flex gap-3 mb-2">
            <Lock className="w-5 h-5 text-cyan-400 shrink-0" />
            <span className="text-white font-semibold text-sm">
              Area Officer or Admin?
            </span>
          </div>
          <p className="text-blue-200 text-sm leading-relaxed ml-8">
            Officers and Admins join by invitation only. Check your email for an
            invite link from CivicPulse.
          </p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full md:w-[55%] flex flex-col items-center justify-center p-6 md:p-8 min-h-screen md:h-screen overflow-y-auto">
        <div
          className="w-full max-w-120 card p-8 fade-up"
          style={{ animationDelay: "0.2s" }}
        >
          <h2 className="text-3xl font-bold mb-2">
            Join <span className="gradient-text">CivicPulse</span>
          </h2>
          <p className="text-slate-500 mb-6">
            Fill in your details to get started.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 shake">
                <AlertCircle size={18} />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Full Name
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
                  placeholder="John Doe"
                />
              </div>
            </div>

            {/* Email */}
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

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative group mb-2">
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

              {/* Strength Meter */}
              {password.length > 0 && (
                <div className="flex gap-1 h-1 mt-2 mb-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`flex-1 rounded-full transition-colors duration-300 ${
                        level <= strength
                          ? strength < 3
                            ? "bg-red-500"
                            : strength < 4
                              ? "bg-amber-500"
                              : "bg-green-500"
                          : "bg-slate-200"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Confirm Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full pl-11 pr-12 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 bg-primary hover:bg-primary-dark hover:scale-[1.02] hover:shadow-lg text-white font-bold rounded-xl transition-all duration-200 disabled:opacity-70 disabled:hover:scale-100 mt-5"
            >
              {loading ? (
                <ButtonSpinner />
              ) : (
                <>
                  <UserPlus size={18} /> Register
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-slate-500 text-sm font-medium">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-blue-600 hover:text-blue-700 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
