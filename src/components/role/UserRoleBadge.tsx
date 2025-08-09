"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Shield, Eye, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface UserRoleBadgeProps {
  walletAddress: string;
  onTherapistResolved?: (therapistId: string | null) => void;
}

/**
 * Displays the user's role given a wallet address.
 * - Therapist (verified/unverified) if wallet belongs to therapists table
 * - Anonymous Client otherwise
 */
export function UserRoleBadge({ walletAddress, onTherapistResolved }: UserRoleBadgeProps) {
  const [role, setRole] = useState<"client" | "therapist">("client");
  const [isVerified, setIsVerified] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    async function check() {
      if (!walletAddress) {
        setRole("client");
        onTherapistResolved?.(null);
        return;
      }
      const { data, error } = await supabase
        .from("therapists")
        .select("id,is_verified")
        .eq("wallet_address", walletAddress)
        .single();
      if (!active) return;
      if (!error && data) {
        setRole("therapist");
        setIsVerified(!!data.is_verified);
        onTherapistResolved?.(data.id);
      } else {
        setRole("client");
        setIsVerified(null);
        onTherapistResolved?.(null);
      }
    }
    check();
    return () => {
      active = false;
    };
  }, [walletAddress, onTherapistResolved]);

  if (role === "therapist") {
    return (
      <Badge variant="outline" className="mx-auto">
        {isVerified ? (
          <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
        ) : (
          <Shield className="w-3 h-3 mr-1 text-purple-400" />
        )}
        Therapist
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="mx-auto">
      <Eye className="w-3 h-3 mr-1" />
      Anonymous Client
    </Badge>
  );
}


