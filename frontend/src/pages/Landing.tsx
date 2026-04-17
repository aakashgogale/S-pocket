import { Link, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  BarChart3,
  ChevronRight,
  Database,
  FileSearch,
  Lock,
  Network,
  Shield,
  ShieldCheck,
  Users,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useAuth } from "../hooks/use-auth";

/* ── Data ─────────────────────────────────────────────────────────── */

const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Features", href: "#features" },
  { label: "Team", href: "#team" },
];

const FEATURES = [
  {
    icon: <Lock size={22} />,
    title: "Secure Data Sharing",
    desc: "End-to-end encrypted transfers with access-controlled data vaults — share confidently without exposure risk.",
  },
  {
    icon: <Users size={22} />,
    title: "Role-Based Access Control",
    desc: "Granular permissions per user role. Users see only what they're authorized for — nothing more, nothing less.",
  },
  {
    icon: <Activity size={22} />,
    title: "Real-Time Threat Detection",
    desc: "AI-powered behavioral analytics flag anomalies and block threats before they escalate.",
  },
  {
    icon: <BarChart3 size={22} />,
    title: "Risk Score Monitoring",
    desc: "Continuous risk scoring for every asset and user. Know your posture at a glance, act instantly.",
  },
  {
    icon: <FileSearch size={22} />,
    title: "Intelligent File Analysis",
    desc: "Deep inspection of every uploaded file — malware signatures, content risk, and classification in seconds.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Upload File",
    desc: "Drag-and-drop or programmatic upload. Files enter the secure ingestion pipeline immediately.",
  },
  {
    step: "02",
    title: "System Scan",
    desc: "Automated scanning checks signatures, content patterns, and behavioral indicators for every byte.",
  },
  {
    step: "03",
    title: "Risk Detection",
    desc: "ML models classify risk level and assign an actionable score — low, medium, or critical.",
  },
  {
    step: "04",
    title: "Secure Access",
    desc: "Role-gated retrieval ensures only authorized identities can access sensitive content.",
  },
  {
    step: "05",
    title: "Admin Monitoring",
    desc: "Security command center surfaces all activity, alerts, and user risk in real time.",
  },
];

const OUTCOMES = [
  {
    icon: <ShieldCheck size={20} />,
    title: "Reduced Cyber Risk",
    desc: "Proactive controls shrink your attack surface before threats materialize.",
  },
  {
    icon: <Network size={20} />,
    title: "Secure Collaboration",
    desc: "Teams share files without fear — every exchange is encrypted and logged.",
  },
  {
    icon: <Activity size={20} />,
    title: "Real-Time Threat Visibility",
    desc: "Full situational awareness with live dashboards and instant alert routing.",
  },
  {
    icon: <Users size={20} />,
    title: "Role-Based Governance",
    desc: "Policy-driven access controls aligned with least-privilege principles.",
  },
  {
    icon: <Database size={20} />,
    title: "Improved Data Security",
    desc: "Immutable audit logs and versioned file storage guarantee data integrity.",
  },
];

const PILLARS = [
  {
    icon: <Shield size={28} />,
    title: "Security",
    metric: "Zero-Trust",
    desc: "Every request authenticated and authorized. No implicit trust — ever.",
    points: [
      "End-to-end AES-256 encryption",
      "Immutable audit trails",
      "Tamper-proof access logs",
    ],
  },
  {
    icon: <Database size={28} />,
    title: "Scalability",
    metric: "∞ Scale",
    desc: "Built on the Internet Computer — your data scales without infrastructure overhead.",
    points: [
      "Decentralized storage layer",
      "Auto-scaling compute canisters",
      "No single point of failure",
    ],
  },
  {
    icon: <Zap size={28} />,
    title: "Performance",
    metric: "<50ms",
    desc: "Sub-second threat detection and file access — speed without compromise.",
    points: [
      "Real-time threat scoring",
      "Low-latency file retrieval",
      "Optimistic UI rendering",
    ],
  },
];

const TEAM = [
  { name: "Aakash Gogale", role: "Full Stack Developer", initials: "AG" },
  { name: "Shruti Sisodiya", role: "Frontend Developer", initials: "SS" },
  { name: "Shreya Saxena", role: "Security Analyst", initials: "SR" },
  { name: "Ayush Pawar", role: "Project Lead", initials: "AP" },
];

/* ── Helpers ───────────────────────────────────────────────────────── */

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: {
    duration: 0.55,
    delay,
    ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
  },
});

/* ── Scroll-aware Navbar ───────────────────────────────────────────── */

function Navbar({ onLogin: _onLogin }: { onLogin: () => void }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      style={{
        transition:
          "background 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease",
        background: scrolled ? "oklch(0.08 0 0 / 0.95)" : "oklch(0.08 0 0 / 0)",
        borderBottom: scrolled
          ? "1px solid oklch(0.2 0 0)"
          : "1px solid transparent",
        boxShadow: scrolled ? "0 4px 24px oklch(0 0 0 / 0.4)" : "none",
        backdropFilter: scrolled ? "blur(16px)" : "none",
      }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <a
          href="#home"
          className="flex items-center gap-2.5"
          data-ocid="nav.brand_link"
        >
          <div
            className="w-8 h-8 rounded flex items-center justify-center"
            style={{ background: "oklch(0.65 0.22 257)" }}
          >
            <Lock size={14} style={{ color: "oklch(0.06 0 0)" }} />
          </div>
          <span
            className="font-display font-bold tracking-tight text-foreground"
            style={{ fontSize: "1.1rem" }}
          >
            S<span style={{ color: "oklch(0.65 0.22 257)" }}>pocket</span>
          </span>
        </a>

        {/* Center nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm">
          {NAV_LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              data-ocid={`nav.${l.label.toLowerCase()}_link`}
              className="text-muted-foreground hover:text-foreground transition-fast"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            data-ocid="nav.login_button"
            className="px-4 py-1.5 rounded border border-border text-sm text-foreground hover:border-primary/40 transition-smooth"
          >
            Login
          </Link>
          <Link
            to="/signup"
            data-ocid="nav.signup_button"
            className="px-4 py-1.5 rounded text-sm font-semibold text-primary-foreground transition-smooth hover:opacity-90 shadow-glow-cyan"
            style={{ background: "oklch(0.65 0.22 257)" }}
          >
            Sign Up
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ── Section Label ─────────────────────────────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-block text-xs font-mono uppercase tracking-[0.18em] mb-4 px-3 py-1 rounded-full border border-primary/25 bg-primary/8"
      style={{ color: "oklch(0.65 0.22 257)" }}
    >
      {children}
    </span>
  );
}

/* ── Landing Page ──────────────────────────────────────────────────── */

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const goToLogin = () => navigate({ to: "/login" });
  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate({ to: "/dashboard" });
      return;
    }
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-background dark">
      <Navbar onLogin={goToLogin} />

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section
        id="home"
        className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      >
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/assets/generated/hero-network.dim_1400x700.jpg"
            alt=""
            className="w-full h-full object-cover opacity-30"
            style={{ filter: "saturate(1.2)" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/20 to-background" />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 90% 60% at 50% -10%, oklch(0.65 0.22 257 / 0.13), transparent)",
            }}
          />
        </div>

        {/* Scanline overlay */}
        <div className="absolute inset-0 z-0 scanline pointer-events-none opacity-40" />

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-24 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono tracking-wider mb-8"
              style={{
                borderColor: "oklch(0.65 0.22 257 / 0.35)",
                background: "oklch(0.65 0.22 257 / 0.08)",
                color: "oklch(0.65 0.22 257)",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: "oklch(0.65 0.22 257)" }}
              />
              SECURE INTELLIGENT DATA SHARING PLATFORM
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.65,
              delay: 0.1,
              ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
            }}
            className="font-display font-extrabold leading-[1.04] tracking-tight text-foreground mb-6"
            style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)" }}
          >
            Risk clarity <br className="hidden sm:block" />
            <span className="text-gradient-cyan">without the noise.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.22 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            Take control of cyber risk with the only platform that spans your
            supply chain attack surface, workflows, workforce and trust
            relationships.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.34 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              type="button"
              onClick={handleGetStarted}
              data-ocid="hero.get_started_button"
              className="group inline-flex items-center gap-2 px-8 py-3.5 rounded font-semibold text-sm transition-smooth hover:opacity-90 shadow-glow-cyan"
              style={{
                background: "oklch(0.65 0.22 257)",
                color: "oklch(0.06 0 0)",
              }}
            >
              Start Securing Files
              <ArrowRight
                size={16}
                className="group-hover:translate-x-1 transition-transform duration-200"
              />
            </button>
            <a
              href="#features"
              data-ocid="hero.learn_more_link"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded border border-border text-foreground font-medium text-sm hover:border-primary/40 transition-smooth"
            >
              Explore Features
              <ChevronRight size={15} />
            </a>
          </motion.div>

          {/* Stat row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="mt-16 flex flex-wrap justify-center gap-8 text-sm text-muted-foreground"
          >
            {[
              { val: "100%", label: "Decentralized" },
              { val: "<50ms", label: "Threat Detection" },
              { val: "AES-256", label: "Encryption" },
              { val: "Zero-Trust", label: "Architecture" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-1.5">
                <span
                  className="font-display font-bold text-base"
                  style={{ color: "oklch(0.65 0.22 257)" }}
                >
                  {s.val}
                </span>
                <span className="text-xs font-mono uppercase tracking-wider opacity-60">
                  {s.label}
                </span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-40"
        >
          <span className="text-xs font-mono tracking-widest uppercase text-muted-foreground">
            scroll
          </span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.4, repeat: Number.POSITIVE_INFINITY }}
            className="w-px h-8"
            style={{ background: "oklch(0.65 0.22 257 / 0.5)" }}
          />
        </motion.div>
      </section>

      {/* ── About / Platform vs Solution ──────────────────────────── */}
      <section
        id="about"
        className="py-28 border-t border-border"
        style={{ background: "oklch(0.1 0 0)" }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <motion.div {...fadeUp()} className="text-center mb-16">
            <SectionLabel>About</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
              Platform vs Solution
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-14">
            {/* Left — The Platform */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.65,
                ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
              }}
              className="bg-card border border-border rounded-lg p-8 accent-line"
              data-ocid="about.platform_card"
            >
              <div className="flex items-center gap-2 mb-5">
                <Network size={18} style={{ color: "oklch(0.65 0.22 257)" }} />
                <span
                  className="text-xs font-mono uppercase tracking-widest"
                  style={{ color: "oklch(0.65 0.22 257)" }}
                >
                  The Platform
                </span>
              </div>
              <h3 className="text-2xl font-display font-bold text-foreground mb-4 leading-snug">
                A unified security fabric for modern enterprise
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-5">
                S pocket is built on the Internet Computer — a decentralized
                cloud that provides tamper-proof compute, infinite scalability,
                and cryptographic identity out of the box. Every file, every
                action, every user interaction is recorded on-chain with full
                auditability.
              </p>
              <ul className="space-y-3">
                {[
                  "Decentralized storage — no single point of failure",
                  "On-chain audit logs immune to tampering",
                  "Internet Identity — passwordless, phishing-resistant auth",
                  "Smart contract execution for access policies",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm text-muted-foreground"
                  >
                    <span
                      className="mt-1 w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center"
                      style={{ background: "oklch(0.65 0.22 257 / 0.15)" }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: "oklch(0.65 0.22 257)" }}
                      />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Right — Our Solution */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.65,
                ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
              }}
              className="bg-card border border-border rounded-lg p-8"
              style={{ borderLeft: "3px solid oklch(0.65 0.22 257 / 0.3)" }}
              data-ocid="about.solution_card"
            >
              <div className="flex items-center gap-2 mb-5">
                <ShieldCheck
                  size={18}
                  style={{ color: "oklch(0.65 0.22 257)" }}
                />
                <span
                  className="text-xs font-mono uppercase tracking-widest"
                  style={{ color: "oklch(0.65 0.22 257)" }}
                >
                  Our Solution
                </span>
              </div>
              <h3 className="text-2xl font-display font-bold text-foreground mb-4 leading-snug">
                Stop threats before they become incidents
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-5">
                Traditional security tools react after the fact. S pocket's
                intelligent pipeline scans every file at upload, continuously
                monitors behavioral signals, and surfaces risk before damage
                occurs. Security teams get clarity — not noise.
              </p>
              <ul className="space-y-3">
                {[
                  "Proactive risk scoring for every file and user",
                  "ML-powered anomaly detection running 24/7",
                  "Automated alert routing to responsible teams",
                  "Admin command center with full threat visibility",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm text-muted-foreground"
                  >
                    <span
                      className="mt-1 w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center"
                      style={{ background: "oklch(0.65 0.22 257 / 0.15)" }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: "oklch(0.65 0.22 257)" }}
                      />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────── */}
      <section
        id="features"
        className="py-28 bg-background border-t border-border"
      >
        <div className="max-w-7xl mx-auto px-6">
          <motion.div {...fadeUp()} className="text-center mb-16">
            <SectionLabel>Platform Capabilities</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
              Security at Every Layer
            </h2>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
              Five core capabilities that give your team complete control from
              upload to access.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.5,
                  delay: i * 0.08,
                  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
                }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="group bg-card border border-border rounded-lg p-6 cursor-default"
                style={{ borderLeft: "3px solid oklch(0.65 0.22 257)" }}
                data-ocid={`features.item.${i + 1}`}
              >
                <div
                  className="w-10 h-10 rounded flex items-center justify-center mb-5 transition-smooth group-hover:shadow-glow-cyan"
                  style={{
                    background: "oklch(0.65 0.22 257 / 0.12)",
                    color: "oklch(0.65 0.22 257)",
                  }}
                >
                  {f.icon}
                </div>
                <h3 className="font-display font-semibold text-foreground text-base mb-2">
                  {f.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {f.desc}
                </p>
              </motion.div>
            ))}

            {/* Wider CTA card */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: FEATURES.length * 0.08 }}
              className="bg-card border border-border rounded-lg p-6 flex flex-col justify-between"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.65 0.22 257 / 0.12), oklch(0.12 0 0))",
                borderColor: "oklch(0.65 0.22 257 / 0.3)",
              }}
              data-ocid="features.cta_card"
            >
              <div>
                <h3 className="font-display font-bold text-foreground text-lg mb-2">
                  Ready to see it in action?
                </h3>
                <p className="text-muted-foreground text-sm">
                  Explore the full platform free. No credit card required.
                </p>
              </div>
              <button
                type="button"
                onClick={handleGetStarted}
                data-ocid="features.cta_button"
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded font-semibold text-sm transition-smooth hover:opacity-90"
                style={{
                  background: "oklch(0.65 0.22 257)",
                  color: "oklch(0.06 0 0)",
                }}
              >
                Get Started
                <ArrowRight size={14} />
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────── */}
      <section
        id="how-it-works"
        className="py-28 border-t border-border"
        style={{ background: "oklch(0.1 0 0)" }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <motion.div {...fadeUp()} className="text-center mb-16">
            <SectionLabel>Process</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
              How It Works
            </h2>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
              Five steps from raw file to secured, classified, and monitored
              asset.
            </p>
          </motion.div>

          <div className="relative">
            {/* Connector line */}
            <div
              className="hidden lg:block absolute top-8 left-0 right-0 h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent, oklch(0.65 0.22 257 / 0.25), oklch(0.65 0.22 257 / 0.25), transparent)",
              }}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {HOW_IT_WORKS.map((step, i) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.5,
                    delay: i * 0.1,
                    ease: [0.22, 1, 0.36, 1] as [
                      number,
                      number,
                      number,
                      number,
                    ],
                  }}
                  className="relative"
                  data-ocid={`how_it_works.item.${i + 1}`}
                >
                  {/* Step number bubble */}
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-5 font-mono font-bold text-sm mx-auto lg:mx-0"
                    style={{
                      background:
                        i === 0
                          ? "oklch(0.65 0.22 257)"
                          : "oklch(0.65 0.22 257 / 0.1)",
                      color:
                        i === 0 ? "oklch(0.06 0 0)" : "oklch(0.65 0.22 257)",
                      border: "1px solid oklch(0.65 0.22 257 / 0.3)",
                    }}
                  >
                    {step.step}
                  </div>
                  <h3 className="font-display font-semibold text-foreground mb-2 text-center lg:text-left">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed text-center lg:text-left">
                    {step.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Expected Outcomes ─────────────────────────────────────── */}
      <section className="py-28 bg-background border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div {...fadeUp()} className="text-center mb-16">
            <SectionLabel>Results</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
              Expected Outcomes
            </h2>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
              What your security team gains on day one.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {OUTCOMES.map((o, i) => (
              <motion.div
                key={o.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.09 }}
                className="bg-card border border-border rounded-lg p-6 flex gap-4"
                data-ocid={`outcomes.item.${i + 1}`}
              >
                <div
                  className="w-10 h-10 rounded flex-shrink-0 flex items-center justify-center mt-0.5"
                  style={{
                    background: "oklch(0.65 0.22 257 / 0.12)",
                    color: "oklch(0.65 0.22 257)",
                  }}
                >
                  {o.icon}
                </div>
                <div>
                  <h3 className="font-display font-semibold text-foreground mb-1">
                    {o.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {o.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Security / Scale / Speed ──────────────────────────────── */}
      <section
        className="py-28 border-t border-border"
        style={{ background: "oklch(0.1 0 0)" }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <motion.div {...fadeUp()} className="text-center mb-16">
            <SectionLabel>Core Pillars</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
              Security. Scalability. Performance.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PILLARS.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: i * 0.12 }}
                whileHover={{
                  scale: 1.025,
                  boxShadow: "0 8px 40px oklch(0.65 0.22 257 / 0.18)",
                  transition: { duration: 0.2 },
                }}
                className="bg-card border border-border rounded-lg p-8 cursor-default"
                style={{ borderTop: "2px solid oklch(0.65 0.22 257 / 0.6)" }}
                data-ocid={`pillars.item.${i + 1}`}
              >
                <div
                  className="w-14 h-14 rounded-lg flex items-center justify-center mb-5"
                  style={{
                    background: "oklch(0.65 0.22 257 / 0.1)",
                    color: "oklch(0.65 0.22 257)",
                  }}
                >
                  {p.icon}
                </div>
                <div
                  className="font-mono font-bold text-2xl mb-1"
                  style={{ color: "oklch(0.65 0.22 257)" }}
                >
                  {p.metric}
                </div>
                <h3 className="font-display font-bold text-foreground text-xl mb-3">
                  {p.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-5">
                  {p.desc}
                </p>
                <ul className="space-y-2">
                  {p.points.map((pt) => (
                    <li
                      key={pt}
                      className="flex items-center gap-2 text-xs text-muted-foreground"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: "oklch(0.65 0.22 257)" }}
                      />
                      {pt}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Team ──────────────────────────────────────────────────── */}
      <section id="team" className="py-28 bg-background border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div {...fadeUp()} className="text-center mb-16">
            <SectionLabel>The Team</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
              Built by Security Experts
            </h2>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
              A cross-functional team obsessed with security, usability, and
              enterprise-grade reliability.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {TEAM.map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="group bg-card border border-border rounded-lg p-6 flex flex-col items-center text-center cursor-default transition-smooth"
                style={{}}
                data-ocid={`team.item.${i + 1}`}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center font-display font-bold text-lg mb-4 transition-smooth group-hover:shadow-glow-cyan"
                  style={{
                    background: "oklch(0.65 0.22 257 / 0.15)",
                    border: "1.5px solid oklch(0.65 0.22 257 / 0.3)",
                    color: "oklch(0.65 0.22 257)",
                  }}
                >
                  {member.initials}
                </div>
                <div className="font-display font-semibold text-foreground text-sm mb-0.5">
                  {member.name}
                </div>
                <div
                  className="text-xs font-mono uppercase tracking-wider"
                  style={{ color: "oklch(0.65 0.22 257 / 0.8)" }}
                >
                  {member.role}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────────────── */}
      <section
        className="py-24 border-t border-border relative overflow-hidden"
        style={{ background: "oklch(0.1 0 0)" }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 80% at 50% 50%, oklch(0.65 0.22 257 / 0.07), transparent)",
          }}
        />
        <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
          <motion.div {...fadeUp()}>
            <SectionLabel>Get Started</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Ready to Secure Your Data?
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Join S pocket today and take control of your file security with
              enterprise-grade tools. Zero trust from day one.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                type="button"
                onClick={handleGetStarted}
                data-ocid="cta.get_started_button"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded font-semibold text-sm transition-smooth hover:opacity-90 shadow-glow-cyan"
                style={{
                  background: "oklch(0.65 0.22 257)",
                  color: "oklch(0.06 0 0)",
                }}
              >
                Start Free Today
                <ArrowRight size={15} />
              </button>
              <Link
                to="/login"
                data-ocid="cta.login_link"
                className="px-8 py-3.5 rounded border border-border text-foreground font-medium text-sm hover:border-primary/40 transition-smooth"
              >
                Sign In
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer
        className="border-t border-border py-10"
        style={{ background: "oklch(0.08 0 0)" }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div
                  className="w-7 h-7 rounded flex items-center justify-center"
                  style={{ background: "oklch(0.65 0.22 257)" }}
                >
                  <Lock size={13} style={{ color: "oklch(0.06 0 0)" }} />
                </div>
                <span className="font-display font-bold text-foreground">
                  S<span style={{ color: "oklch(0.65 0.22 257)" }}>pocket</span>
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-mono max-w-xs leading-relaxed">
                S pocket – Secure Intelligent Data Sharing Platform
              </p>
            </div>

            {/* Nav links */}
            <nav className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              {[
                { label: "About", href: "#about" },
                { label: "Features", href: "#features" },
                { label: "Team", href: "#team" },
                { label: "Login", href: "/login", isRoute: true },
              ].map((l) =>
                l.isRoute ? (
                  <Link
                    key={l.label}
                    to={l.href as "/login"}
                    data-ocid={`footer.${l.label.toLowerCase()}_link`}
                    className="hover:text-foreground transition-fast"
                  >
                    {l.label}
                  </Link>
                ) : (
                  <a
                    key={l.label}
                    href={l.href}
                    data-ocid={`footer.${l.label.toLowerCase()}_link`}
                    className="hover:text-foreground transition-fast"
                  >
                    {l.label}
                  </a>
                ),
              )}
            </nav>
          </div>

          <div
            className="mt-8 pt-6 border-t text-xs font-mono text-muted-foreground flex items-center gap-2"
            style={{ borderColor: "oklch(0.2 0 0)" }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: "oklch(0.65 0.22 257)" }}
            />
            Secured by Internet Computer Protocol
          </div>
        </div>
      </footer>
    </div>
  );
}
