import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, ArrowRight, Loader2, Lock, Shield } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { GoogleLoginButton } from "../components/auth/GoogleLoginButton";
import { useAuth } from "../hooks/use-auth";

export default function Login() {
  const navigate = useNavigate();
  const { login, loginWithGoogle, loginStatus } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEmailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()), [email]);
  const isFormValid = useMemo(
    () => Boolean(email.trim() && password.trim() && isEmailValid),
    [email, password, isEmailValid]
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      toast.error("Please enter both email and password.");
      return;
    }

    if (!isEmailValid) {
      setError("Please enter a valid email address.");
      toast.error("Invalid email format.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      toast.success("Login successful.");
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      const message = err?.response?.data?.message || "Login failed. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async (idToken: string) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await loginWithGoogle({ idToken });
      toast.success("Google login successful.");
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      const message = err?.response?.data?.message || "Google login failed. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const busy = isSubmitting || loginStatus === "logging-in";
  const disableSubmit = busy || !isFormValid;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 mesh-gradient pointer-events-none" />
      <div className="absolute inset-0 scanline pointer-events-none opacity-40" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative z-10 w-full max-w-md px-4"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-card border border-border shadow-glow-cyan mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-display font-bold text-gradient-cyan mb-1">S pocket</h1>
          <p className="text-sm text-muted-foreground tracking-widest uppercase font-mono">
            Secure Intelligent Data Sharing
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-elevated p-8">
          <h2 className="text-xl font-display font-semibold text-foreground mb-1">Welcome back</h2>
          <p className="text-sm text-muted-foreground mb-8">Sign in with your account credentials</p>

          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={disableSubmit}
              size="lg"
              className="w-full h-12 text-base font-semibold rounded-xl transition-smooth shadow-glow-cyan hover:opacity-90"
            >
              {busy ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Sign in
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-mono uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <GoogleLoginButton onToken={handleGoogleLogin} onError={setError} />

          <p className="text-center text-sm text-muted-foreground">
            New to S pocket?{" "}
            <Link to="/signup" className="font-medium text-primary hover:opacity-80">
              Create an account
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
