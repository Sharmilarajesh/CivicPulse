"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import api from "@/lib/axios";
import { ButtonSpinner } from "@/components/LoadingSpinner";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.post("/auth/forgot-password", { email });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to send reset link");
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

          <h1 className="text-4xl font-bold mb-6">Reset Password</h1>
          <p className="text-text-muted mb-12 text-lg">
            Forgot your password? No worries, we'll send you reset instructions.
          </p>

          <div className="space-y-6">
            {[
              "Quick and secure recovery",
              "Access your account instantly",
              "Keep your reports safe",
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
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">
              Forgot Password?
            </h2>
            <p className="text-slate-500 mt-2">
              Enter the email address associated with your account.
            </p>
          </div>

          {success ? (
            <div className="bg-green-50 border border-green-200 text-green-700 p-6 rounded-xl text-center mb-6 fade-in">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-1">Check your email</h3>
              <p className="text-sm">
                If an account exists with {email}, we've sent instructions to reset your password.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 flex items-center gap-3 fade-in">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0"></div>
                  {error}
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
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-md flex justify-center items-center disabled:opacity-70 mt-6"
              >
                {loading ? <ButtonSpinner /> : "Send Reset Link"}
              </button>
            </form>
          )}

          <div className="text-center mt-6">
            <p className="text-slate-500 text-sm">
              Remember your password?{" "}
              <Link
                href="/login"
                className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
