import { Link, useLocation } from "@tanstack/react-router";
import {
  Activity,
  Files,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  UserCircle2,
  ShieldAlert,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useAuth } from "../../hooks/use-auth";
import { useIsAdmin } from "../../hooks/use-backend";
import { cn } from "../../lib/utils";

interface NavLink {
  label: string;
  path: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const NAV_LINKS: NavLink[] = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: <LayoutDashboard size={18} />,
  },
  { label: "Profile", path: "/profile", icon: <UserCircle2 size={18} /> },
  { label: "My Files", path: "/files", icon: <Files size={18} /> },
  { label: "Activity", path: "/activity", icon: <Activity size={18} /> },
  {
    label: "Admin Panel",
    path: "/admin",
    icon: <ShieldAlert size={18} />,
    adminOnly: true,
  },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { logout } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleLinks = NAV_LINKS.filter((l) => !l.adminOnly || isAdmin);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-primary flex items-center justify-center">
            <Lock size={14} className="text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg text-foreground tracking-tight">
            S pocket
          </span>
        </div>
      </div>

      {/* Nav links */}
      <nav
        className="flex-1 px-3 py-4 space-y-1"
        aria-label="Sidebar navigation"
      >
        {visibleLinks.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              data-ocid={`sidebar.${link.label.toLowerCase().replace(/\s/g, "_")}.link`}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-smooth relative group",
                isActive
                  ? "bg-primary/10 text-primary border-l-2 border-primary pl-[10px]"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
            >
              <span
                className={cn(
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-foreground",
                )}
              >
                {link.icon}
              </span>
              {link.label}
              {link.adminOnly && (
                <span className="ml-auto text-[10px] font-mono text-primary/60 bg-primary/10 px-1.5 py-0.5 rounded">
                  ADMIN
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-border">
        <button
          type="button"
          onClick={() => logout()}
          data-ocid="sidebar.logout_button"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-smooth"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <motion.aside
        initial={{ x: -280, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="hidden md:flex w-64 flex-col fixed inset-y-0 left-0 z-40 bg-card border-r border-border"
        aria-label="Dashboard sidebar"
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              key="mobile-sidebar"
              initial={{ x: -280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -280, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-card border-r border-border md:hidden"
            >
              <div className="absolute top-4 right-4">
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  data-ocid="sidebar.close_button"
                  className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-smooth"
                >
                  <X size={18} />
                </button>
              </div>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-card border-b border-border">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            data-ocid="sidebar.open_modal_button"
            className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-smooth"
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <Lock size={12} className="text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-base text-foreground">
              S pocket
            </span>
          </div>
          <div className="w-8" />
        </div>

        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
