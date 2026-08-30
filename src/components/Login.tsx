import React, { useState } from "react";
import { Shield, Lock, User, AlertCircle, Sparkles } from "lucide-react";
import { motion } from "motion/react";

interface LoginProps {
  onLoginSuccess: (role: "EMT" | "Supervisor") => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
      }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok && data.success) {
          onLoginSuccess(data.role);
        } else {
          setError(data.error || "Invalid username or password. Please verify credentials.");
        }
      })
      .catch((err) => {
        console.error("Login verification failed:", err);
        setError("Network error. Please try again.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const fillCredentials = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setError("");
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col justify-between p-6 md:p-12 font-sans selection:bg-blue-900 selection:text-white relative overflow-hidden">
      {/* Background Decorative Patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(30,58,138,0.05),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(220,38,38,0.05),transparent_50%)]" />
      
      {/* Top Brand Block */}
      <header className="relative z-10 flex items-center gap-3 w-full max-w-md mx-auto">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center p-1 shadow border border-slate-200">
          <div className="w-full h-full bg-red-600 rounded-full flex items-center justify-center font-bold text-white text-xl leading-none">+</div>
        </div>
        <div>
          <h1 className="text-sm font-black tracking-wider text-slate-900">SFGA EMS OPERATIONS</h1>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="relative z-10 w-full max-w-md mx-auto my-auto py-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="bg-white border border-slate-200 rounded shadow-md border-t-4 border-t-blue-900 p-8"
        >
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-2">Login</h2>
            <p className="text-slate-500 text-xs">Please log in to access medical protocols, SOPs, and shift logs.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 font-mono">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. EMT"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-colors font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 font-mono">
                Access Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-colors font-sans"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-3 flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <p className="text-xs text-red-800 leading-normal font-sans">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-900 hover:bg-blue-800 active:bg-blue-950 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-2.5 px-4 rounded text-xs transition-all font-sans cursor-pointer flex justify-center items-center gap-2 shadow-sm"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Establish Connection"
              )}
            </button>
          </form>
        </motion.div>
      </main>

      {/* Footer Branding */}
      <footer className="relative z-10 w-full max-w-md mx-auto text-center">
        <p className="text-[10px] text-slate-500 font-mono leading-relaxed uppercase">
          SECURE COMMUNICATIONS PORTAL &copy; {new Date().getFullYear()} SIX FLAGS GREAT ADVENTURE SAFETY & SECURITY. UNAUTHORIZED LOGINS ARE SUBJECT TO MONITORING AND ADMINISTRATIVE REVIEW.
        </p>
      </footer>
    </div>
  );
}
