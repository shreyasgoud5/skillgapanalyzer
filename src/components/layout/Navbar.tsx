"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, History, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import AuthButton from "@/components/auth/AuthButton";

export default function Navbar() {
  const pathname = usePathname();

  const links = [
    { name: "Analyze", href: "/", icon: Activity },
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "History", href: "/history", icon: History },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center mx-auto px-4">
        <div className="flex w-full justify-between items-center">
          <Link href="/" className="flex items-center space-x-4">
            <Activity className="h-6 w-6 text-primary animate-pulse" />
            <span className="font-bold hidden sm:inline-block tracking-wide">
              Skill Gap Analyzer
            </span>
          </Link>
          <div className="flex items-center ml-10 space-x-6 text-sm font-medium">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "transition-colors hover:text-foreground/80 flex items-center space-x-2",
                    pathname === link.href ? "text-foreground" : "text-foreground/60"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline-block">{link.name}</span>
                </Link>
              );
            })}
          </div>
          <div className="flex items-center ml-auto pl-6">
            <AuthButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
