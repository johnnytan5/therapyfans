"use client";

import { Button } from "@/components/ui/button";

import { Eye, Shield, Zap, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Home() {

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-background via-background to-purple-950/20 cyber-grid">
      {/* Hero Section */}
      <section className="relative px-6 sm:px-8 lg:px-12 h-full flex items-center justify-center">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">

            
            <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight text-foreground sm:text-7xl slide-up">
              Anonymous Therapy,{" "}
              <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent neon-text">
                Verified Trust
              </span>
            </h1>
            
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground fade-in">
              Connect with licensed therapists through zkLogin anonymity. Your identity stays private,
              their credentials stay verified. Therapy sessions powered by Web3.
            </p>
            
            <div className="mt-10 flex items-center justify-center gap-x-6 scale-in">
              <Button size="lg" variant="gradient" className="group glow-purple hover:glow-purple transition-all duration-300" asChild>
                <Link href="/marketplace">
                  Find a Therapist
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-glow hover:text-purple-400 transition-all duration-300" asChild>
                <Link href="/marketplace">
                  Become a Therapist
                </Link>
              </Button>
            </div>
            
            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground fade-in">
              <div className="flex items-center gap-2 hover:text-purple-400 transition-colors">
                <Eye className="w-4 h-4 text-purple-400" />
                100% Anonymous
              </div>
              <div className="flex items-center gap-2 hover:text-blue-400 transition-colors">
                <Shield className="w-4 h-4 text-blue-400" />
                zk-Verified Licenses
              </div>
              <div className="flex items-center gap-2 hover:text-cyan-400 transition-colors">
                <Zap className="w-4 h-4 text-cyan-400" />
                Instant Booking
              </div>
            </div>
          </div>
        </div>
        
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-[calc(50%-4rem)] top-10 -z-10 transform-gpu blur-3xl sm:left-[calc(50%-18rem)] lg:left-48 lg:top-[calc(50%-30rem)] xl:left-[calc(50%-24rem)]">
            <div className="aspect-[1108/632] w-[69.25rem] bg-gradient-to-r from-purple-500/30 via-blue-500/20 to-cyan-500/30 opacity-40 animate-pulse"></div>
          </div>
          <div className="absolute right-[calc(50%-4rem)] bottom-10 -z-10 transform-gpu blur-3xl">
            <div className="aspect-[1108/632] w-[40rem] bg-gradient-to-l from-cyan-400/20 to-purple-600/20 opacity-30"></div>
          </div>
        </div>
      </section>








    </div>
  );
}
