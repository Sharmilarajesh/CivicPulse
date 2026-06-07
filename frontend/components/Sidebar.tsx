"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import { socket } from "@/lib/socket";
import {
  Home,
  LogIn,
  UserPlus,
  FilePlus,
  ClipboardList,
  Bell,
  User,
  Building2,
  Map as MapIcon,
  BarChart2,
  Users,
  LogOut,
  Menu,
  X,
} from "lucide-react";

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications count
  useEffect(() => {
    if (!user) return;

    const fetchNotifs = async () => {
      try {
        const { data } = await api.get("/notifications");
        const unread = data.notifications.filter((n: any) => !n.isRead).length;
        setUnreadCount(unread);
      } catch (e) { }
    };

    fetchNotifs();

    socket.on("notification", (data: any) => {
      if (!data || !data.userId || data.userId.toString() === user.id?.toString()) {
        setUnreadCount((prev) => prev + 1);
      }
    });

    window.addEventListener("notifications_updated", fetchNotifs);

    return () => {
      socket.off("notification");
      window.removeEventListener("notifications_updated", fetchNotifs);
    };
  }, [user, pathname]);

  if (['/login', '/register', '/accept-invite'].includes(pathname)) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // Define nav links based on role
  const getNavLinks = () => {
    if (!user) {
      return [
        { name: "Home", href: "/", icon: Home },
        { name: "Login", href: "/login", icon: LogIn },
        { name: "Register", href: "/register", icon: UserPlus },
      ];
    }

    const citizenLinks = [
      { name: "Home", href: "/", icon: Home },
      { name: "Report Issue", href: "/report", icon: FilePlus },
      { name: "My Reports", href: "/my-reports", icon: ClipboardList },
      {
        name: "Notifications",
        href: "/notifications",
        icon: Bell,
        badge: unreadCount,
      },
    ];

    const officerLinks = [
      { name: "Home", href: "/", icon: Home },
      { name: "My Area", href: "/officer", icon: Building2 },
      {
        name: "Notifications",
        href: "/notifications",
        icon: Bell,
        badge: unreadCount,
      },
    ];

    type NavLink = { name: string; href: string; icon: any; badge?: number };
    const adminLinks: NavLink[] = [
      { name: "Home", href: "/", icon: Home },
      { name: "Control Panel", href: "/admin", icon: MapIcon },
      { name: "Analytics", href: "/admin/analytics", icon: BarChart2 },
      { name: "Invite Users", href: "/admin/invite", icon: UserPlus },
    ];

    if (user.role === 'super_admin') {
      adminLinks.push({ name: "Manage Users", href: "/admin/users", icon: Users });
    }

    adminLinks.push({
      name: "Notifications",
      href: "/notifications",
      icon: Bell,
      badge: unreadCount,
    });

    switch (user.role) {
      case "citizen":
        return citizenLinks;
      case "officer":
        return officerLinks;
      case "admin":
      case "super_admin":
        return adminLinks;
      default:
        return [];
    }
  };

  const links = getNavLinks();

  return (
    <>
      {/* Mobile Top Bar — visible only on mobile */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-sidebar-bg border-b border-sidebar-border flex items-center justify-between px-4 h-14">
        {/* Hamburger */}
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Logo — always visible on mobile */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-cyan-500"><Building2 size={24} /></span>
          <span className="text-base font-extrabold tracking-tight">
            <span className="text-white">Civic</span>
            <span className="text-cyan-500">Pulse</span>
          </span>
        </Link>

        {/* Right side — notification bell or empty */}
        <div className="w-9 flex justify-end">
          {user && (
            <Link
              href="/notifications"
              className="relative text-slate-400 hover:text-white transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-sidebar-bg" />
              )}
            </Link>
          )}
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-900/50 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex flex-col h-full bg-sidebar-bg border-r border-sidebar-border w-65 shrink-0 text-border">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
            <Link
              href="/"
              className="flex items-center gap-2"
              onClick={() => setIsOpen(false)}
            >
              <span className="text-xl font-bold tracking-tight text-white">
                Civic<span className="text-cyan-500">Pulse</span>
              </span>
            </Link>
          </div>

          {/* User Info */}
          {user && (
            <div className="p-6 border-b border-sidebar-border flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold mb-3 shadow-lg">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <h3 className="text-sm font-bold text-white mb-1">{user.name}</h3>
              <span
                className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full
                ${user.role === "citizen" ? "bg-blue-100 text-blue-700" : ""}
                ${user.role === "officer" ? "bg-green-100 text-green-700" : ""}
                ${user.role === "admin" ? "bg-red-100 text-red-700" : ""}
                ${user.role === "super_admin" ? "bg-purple-100 text-purple-700" : ""}
              `}
              >
                {user.role === "officer" ? "Area Officer" : user.role.replace("_", " ")}
              </span>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
            {links.map((link) => {
              const isActive = (link.href === '/' || link.href === '/admin')
                ? pathname === link.href
                : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative overflow-hidden group
                    ${isActive
                      ? "bg-blue-600/15 text-blue-400"
                      : "text-text-muted hover:bg-white/5 hover:text-white"
                    }
                  `}
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r-md fade-in" />
                  )}
                  <link.icon
                    size={18}
                    className={
                      isActive
                        ? "text-blue-400"
                        : "text-[#64748b] group-hover:text-white transition-colors"
                    }
                  />
                  {link.name}

                  {link.badge !== undefined && link.badge > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full fade-in">
                      {link.badge > 99 ? "99+" : link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          {user && (
            <div className="p-4 border-t border-sidebar-border space-y-1.5">
              <Link
                href="/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-text-muted hover:bg-white/5 hover:text-white transition-all"
              >
                <User size={18} className="text-[#64748b]" />
                Profile
              </Link>
              <button
                onClick={() => {
                  setIsOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-text-muted hover:bg-red-500/10 hover:text-red-400 transition-all"
              >
                <LogOut
                  size={18}
                  className="text-[#64748b] group-hover:text-red-400"
                />
                Logout
              </button>
            </div>
          )}
        </div>
        {isOpen && (
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 -right-12 p-2 text-white lg:hidden fade-in"
          >
            <X size={24} />
          </button>
        )}
      </div>
    </>
  );
};
