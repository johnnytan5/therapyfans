"use client";

import { Button } from "@/components/ui/button";
import { TherapistCard } from "@/components/therapy/TherapistCard";
import { Badge } from "@/components/ui/badge";
import { getTherapists, TherapistWithSpecializations } from "@/lib/therapistService";
import { Shield, Eye, Clock, Zap, Users, Lock, Star, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [therapists, setTherapists] = useState<TherapistWithSpecializations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTherapists = async () => {
      try {
        const data = await getTherapists();
        setTherapists(data);
      } catch (error) {
        console.error('Error fetching therapists:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTherapists();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/20 cyber-grid">
      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-32 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <div className="mb-8 fade-in">
              <Badge variant="outline" className="mb-4 glass border-glow animate-pulse">
                <Shield className="w-3 h-3 mr-1 text-purple-400" />
                Anonymous & Verified Therapy
              </Badge>
            </div>
            
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

      {/* How It Works Section */}
      <section className="py-24 bg-card/50 border-t border-border">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center slide-up">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-lg leading-8 text-muted-foreground">
              Three simple steps to anonymous, verified therapy
            </p>
          </div>
          
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col fade-in glass p-6 rounded-lg border-glow hover:glow-purple transition-all duration-300">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-foreground">
                  <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white font-bold glow-purple">
                    1
                  </div>
                  Browse Anonymous Therapists
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
                  <p className="flex-auto">
                    Browse verified therapists by their anonymous profiles, vibe tags, and specializations.
                    No real names, just authentic therapy styles.
                  </p>
                </dd>
              </div>
              
              <div className="flex flex-col fade-in glass p-6 rounded-lg border-glow hover:glow-blue transition-all duration-300">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-foreground">
                  <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold glow-blue">
                    2
                  </div>
                  Match & Book Sessions
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
                  <p className="flex-auto">
                    AI-powered matching based on your needs. Book 15-minute sessions instantly
                    with SUI payments and receive session NFT tokens.
                  </p>
                </dd>
              </div>
              
              <div className="flex flex-col fade-in glass p-6 rounded-lg border-glow hover:glow-green transition-all duration-300">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-foreground">
                  <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-green-500 text-white font-bold glow-green">
                    3
                  </div>
                  Anonymous Video Sessions
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
                  <p className="flex-auto">
                    Connect through secure, anonymous video calls. Rate your experience
                    while maintaining complete privacy for both parties.
                  </p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* Therapist Showcase */}
      <section className="py-24 bg-gradient-to-br from-background to-secondary/30 cyber-grid">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center slide-up">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Meet Our <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Anonymous</span> Therapists
            </h2>
            <p className="mt-4 text-lg leading-8 text-muted-foreground">
              Licensed professionals with verified credentials, authentic personalities
            </p>
          </div>
          
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
            {loading ? (
              // Loading skeleton
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="glass p-6 rounded-lg border-glow animate-pulse">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-muted rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-32"></div>
                      <div className="h-3 bg-muted rounded w-24"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded w-full"></div>
                    <div className="h-3 bg-muted rounded w-3/4"></div>
                  </div>
                </div>
              ))
            ) : therapists.length > 0 ? (
              therapists.slice(0, 3).map((therapist) => (
                <TherapistCard
                  key={therapist.id}
                  therapist={therapist}
                  onBookSession={() => {
                    window.location.href = `/therapist/${therapist.id}`;
                  }}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">No therapists available at the moment.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Trust & Privacy Section */}
      <section className="py-24 bg-card/50 border-t border-border">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center slide-up">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Privacy-First, <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">Trust-Verified</span>
            </h2>
            <p className="mt-4 text-lg leading-8 text-muted-foreground">
              Advanced cryptographic privacy with transparent credential verification
            </p>
          </div>
          
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2">
              <div className="relative pl-16 glass p-6 rounded-lg border-glow hover:glow-purple transition-all duration-300">
                <dt className="text-base font-semibold leading-7 text-foreground">
                  <div className="absolute left-4 top-6 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 glow-purple">
                    <Lock className="h-6 w-6 text-white" />
                  </div>
                  zkLogin Anonymous Identity
                </dt>
                <dd className="mt-2 text-base leading-7 text-muted-foreground">
                  Zero-knowledge authentication keeps your identity completely private.
                  Therapists and clients interact through anonymous aliases only.
                </dd>
              </div>
              
              <div className="relative pl-16 glass p-6 rounded-lg border-glow hover:glow-blue transition-all duration-300">
                <dt className="text-base font-semibold leading-7 text-foreground">
                  <div className="absolute left-4 top-6 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 glow-blue">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  zk-Proof Credentials
                </dt>
                <dd className="mt-2 text-base leading-7 text-muted-foreground">
                  Therapist licenses and certifications verified through zero-knowledge proofs.
                  Trust their qualifications without exposing personal information.
                </dd>
              </div>
              
              <div className="relative pl-16 glass p-6 rounded-lg border-glow hover:glow-green transition-all duration-300">
                <dt className="text-base font-semibold leading-7 text-foreground">
                  <div className="absolute left-4 top-6 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-green-600 glow-green">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  Session NFT Tokens
                </dt>
                <dd className="mt-2 text-base leading-7 text-muted-foreground">
                  Each session generates a unique NFT token as proof of completion.
                  Collectible therapy records that auto-expire for privacy.
                </dd>
              </div>
              
              <div className="relative pl-16 glass p-6 rounded-lg border-glow hover:border-orange-500/50 transition-all duration-300">
                <dt className="text-base font-semibold leading-7 text-foreground">
                  <div className="absolute left-4 top-6 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-500 shadow-lg shadow-orange-500/30">
                    <Star className="h-6 w-6 text-white" />
                  </div>
                  Anonymous Reviews
                </dt>
                <dd className="mt-2 text-base leading-7 text-muted-foreground">
                  Rate and review sessions without revealing your identity.
                  Help others find the right therapeutic match while staying anonymous.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-t from-background to-card/50 border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
          <div className="flex justify-center space-x-6 md:order-2">
            <a href="#" className="text-muted-foreground hover:text-purple-400 transition-colors">
              Terms & Conditions
            </a>
            <a href="#" className="text-muted-foreground hover:text-blue-400 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-muted-foreground hover:text-cyan-400 transition-colors">
              FAQ
            </a>
          </div>
          <div className="mt-8 md:order-1 md:mt-0">
            <p className="text-center text-xs leading-5 text-muted-foreground">
              &copy; 2024 <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent font-semibold">TherapyFans</span>. Anonymous therapy platform powered by Web3.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
