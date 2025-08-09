"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EnokiWalletConnect } from "@/components/wallet/EnokiWalletConnect";
import { useClientProfile } from "@/components/providers/ClientAuthProvider";
import { 
  Home, 
  Search, 
  Calendar, 
  User, 
  Settings, 
  HelpCircle,
  Wallet,
  ChevronDown,
  LogOut,
  Shield,
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  isActive?: (pathname: string) => boolean;
}

const getNavItems = (walletAddress?: string): NavItem[] => {
  const baseItems: NavItem[] = [
    {
      label: "Home",
      href: "/",
      icon: <Home className="w-4 h-4" />,
      isActive: (pathname) => pathname === "/"
    },
    {
      label: "Find Therapists", 
      href: "/marketplace",
      icon: <Search className="w-4 h-4" />,
      isActive: (pathname) => pathname === "/marketplace" || pathname.startsWith("/therapist")
    }
  ];

  // Only add "My Sessions" if we have a wallet address to avoid duplicate /marketplace href
  if (walletAddress) {
    baseItems.push({
      label: "My Sessions",
      href: `/client/${encodeURIComponent(walletAddress)}`,
      icon: <Calendar className="w-4 h-4" />,
      isActive: (pathname) => pathname.startsWith("/client")
    });
  }

  return baseItems;
};

export function GlobalNavbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { client, wallet_address } = useClientProfile();
  
  const navItems = getNavItems(wallet_address || undefined);

  // Don't show navbar on active session pages
  if (pathname.includes("/session/") && !pathname.includes("lobby")) {
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center glow-purple">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                TherapyFans
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map((item) => {
                const isActive = item.isActive ? item.isActive(pathname) : pathname === item.href;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2",
                      isActive
                        ? "text-purple-400 bg-purple-500/10 border border-purple-500/30 glow-purple" 
                        : "text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent"
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Side Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <EnokiWalletConnect />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 border-t border-border">
              {navItems.map((item) => {
                const isActive = item.isActive ? item.isActive(pathname) : pathname === item.href;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium transition-all duration-200",
                      isActive
                        ? "text-purple-400 bg-purple-500/10 border border-purple-500/30" 
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                );
              })}
              
              {/* Mobile Connect Wallet */}
              <div className="pt-4 border-t border-border">
                <div className="px-3 py-2">
                  <EnokiWalletConnect />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>


    </nav>
  );
}