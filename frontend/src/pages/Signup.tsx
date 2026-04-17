import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, ArrowRight, Loader2, Shield, UserPlus } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../hooks/use-auth";

export default function Signup() {
  const navigate = useNavigate();
  const { register, loginStatus } = useAuth();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEmailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()), [email]);
  const isFormValid = useMemo(
    () =>
      Boolean(fullName.trim() && username.trim() && email.trim() && password.trim()) &&
      isEmailValid &&
      password.length >= 8,
    [fullName, username, email, password, isEmailValid]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !username.trim() || !email.trim() || !password.trim()) {
      setError("All fields are required.");
      toast.error("Please fill all required fields.");
      return;
    }

    if (!isEmailValid) {
      setError("Please enter a valid email address.");
      toast.error("Invalid email format.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      toast.error("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        fullName: fullName.trim(),
        username: username.trim(),
        email: email.trim(),
        password,
      });
      toast.success("Account created successfully.");
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      const message = err?.response?.data?.message || "Registration failed. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const busy = isSubmitting || loginStatus === "logging-in";
  const disableSubmit = busy || !isFormValid;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden py-12">
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
          <h2 className="text-xl font-display font-semibold text-foreground mb-1">Create account</h2>
          <p className="text-sm text-muted-foreground mb-8">Register and start using your secure vault</p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="full-name">Full Name</Label>
              <Input
                id="full-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                autoComplete="name"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                autoComplete="username"
              />
            </div>

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
                placeholder="At least 8 characters"
                autoComplete="new-password"
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
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create account
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

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-primary hover:opacity-80">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
