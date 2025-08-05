"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

const mainNavItems: NavItem[] = [
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
  },
  {
    label: "My Sessions",
    href: "/client/client-1", 
    icon: <Calendar className="w-4 h-4" />,
    isActive: (pathname) => pathname.startsWith("/client")
  }
];

export function GlobalNavbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isWalletDropdownOpen, setIsWalletDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  // Mock wallet data
  const suiBalance = 25.50;
  const walletAddress = "0x1234...5678";
  const isWalletConnected = true;

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
              {mainNavItems.map((item) => {
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
            {/* Wallet Dropdown */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 border-glow hover:glow-green transition-all duration-200"
                onClick={() => setIsWalletDropdownOpen(!isWalletDropdownOpen)}
              >
                <Wallet className="w-4 h-4 text-green-400" />
                <span className="text-green-400 font-mono">{suiBalance.toFixed(2)} SUI</span>
                <ChevronDown className="w-3 h-3" />
              </Button>

              {isWalletDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 glass rounded-lg shadow-lg border border-border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Wallet Balance</span>
                    <Badge variant="outline" className="text-green-400 border-green-400/30">
                      Connected
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-green-400 font-mono">
                      {suiBalance.toFixed(2)} SUI
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {walletAddress}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-border">
                    <Button size="sm" variant="outline" className="flex-1">
                      Add Funds
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      Send
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* User Dropdown */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 border-glow hover:glow-blue transition-all duration-200"
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              >
                <User className="w-4 h-4" />
                <ChevronDown className="w-3 h-3" />
              </Button>

              {isUserDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 glass rounded-lg shadow-lg border border-border p-2 space-y-1">
                  <Link href="/client/client-1" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors">
                    <User className="w-4 h-4" />
                    <span>My Profile</span>
                  </Link>
                  
                  <Link href="/settings" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors">
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </Link>
                  
                  <Link href="/help" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors">
                    <HelpCircle className="w-4 h-4" />
                    <span>Help & Support</span>
                  </Link>
                  
                  <hr className="border-border my-2" />
                  
                  <button className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors text-red-400 w-full text-left">
                    <LogOut className="w-4 h-4" />
                    <span>Disconnect</span>
                  </button>
                </div>
              )}
            </div>
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
              {mainNavItems.map((item) => {
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
              
              {/* Mobile Wallet Info */}
              <div className="pt-4 border-t border-border">
                <div className="px-3 py-2">
                  <div className="text-sm text-muted-foreground">Wallet Balance</div>
                  <div className="text-lg font-mono text-green-400">{suiBalance.toFixed(2)} SUI</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close dropdowns */}
      {(isWalletDropdownOpen || isUserDropdownOpen) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setIsWalletDropdownOpen(false);
            setIsUserDropdownOpen(false);
          }}
        />
      )}
    </nav>
  );
}