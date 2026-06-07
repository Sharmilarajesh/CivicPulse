"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, CheckCircle2, Eye, EyeOff, AlertCircle, ArrowLeft } from "lucide-react";
import api from "@/lib/axios";
import { ButtonSpinner } from "@/components/LoadingSpinner";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
    
    if (!token) {
      setError("Invalid or missing reset token. Please request a new link.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data } = await api.post(`/auth/reset-password/${token}`, { newPassword: password });
      setSuccess(data.message || "Password reset successful. You can now login.");
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center fade-in">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Invalid Link</h2>
        <p className="text-slate-600 mb-6">
          The password reset link is missing or invalid. Please request a new one.
        </p>
        <Link
          href="/forgot-password"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors inline-block"
        >
          Request New Link
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-700 p-8 rounded-xl text-center fade-in">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">Password Reset Successfully!</h3>
        <p className="text-sm mb-6">
          {success}
        </p>
        <Link
          href="/login"
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors inline-block"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">
          Create New Password
        </h2>
        <p className="text-slate-500 mt-2">
          Your new password must be different from previous used passwords.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 flex items-center gap-3 fade-in">
            <div className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0"></div>
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            New Password
          </label>
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
              placeholder="Enter new password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          
          {/* Password Strength Indicator */}
          {password.length > 0 && (
            <div className="mt-2 flex gap-1 h-1.5 w-full">
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  className={`flex-1 rounded-full transition-all duration-300 ${
                    strength >= level
                      ? strength < 3
                        ? "bg-red-500"
                        : strength < 5
                        ? "bg-amber-400"
                        : "bg-green-500"
                      : "bg-slate-200"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

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
              placeholder="Confirm new password"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-md flex justify-center items-center disabled:opacity-70 mt-6"
        >
          {loading ? <ButtonSpinner /> : "Reset Password"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPassword() {
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
          <Link href="/login" className="inline-flex items-center gap-2 text-text-muted hover:text-white transition-colors group">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Login</span>
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

          <h1 className="text-4xl font-bold mb-6">Secure Your Account</h1>
          <p className="text-text-muted mb-12 text-lg">
            Create a strong new password to protect your CivicPulse account.
          </p>

          <div className="space-y-6">
            {[
              "Use at least 8 characters",
              "Include numbers and symbols",
              "Don't reuse old passwords",
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

      {/* RIGHT PANEL - Form */}
      <div className="w-full md:w-[55%] flex flex-col items-center justify-center p-6 md:p-8 min-h-screen md:h-screen overflow-y-auto">
        <div
          className="w-full max-w-110 card p-8 fade-up"
          style={{ animationDelay: "0.2s" }}
        >
          <Suspense fallback={<div className="flex justify-center"><ButtonSpinner /></div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
