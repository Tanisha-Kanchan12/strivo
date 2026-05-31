"use client";

import { Copy, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface ReferFriendSectionProps {
  userId: string;
}

export function ReferFriendSection({ userId }: ReferFriendSectionProps) {
  const [referralCount, setReferralCount] = useState(0);
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "https://strivo.app";
  const link = `${baseUrl}/join?ref=${userId}`;

  useEffect(() => {
    fetch("/api/referrals")
      .then((r) => r.json())
      .then((data) => setReferralCount(data.count ?? 0))
      .catch(() => setReferralCount(0));
  }, []);

  function copyLink() {
    navigator.clipboard.writeText(link);
    toast.success("Referral link copied!");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Users className="h-5 w-5 text-primary" />
          Invite a Friend
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-strivo-secondary">
          Share Strivo with friends. When they complete onboarding, you both earn
          the Community Builder badge.
        </p>
        <div className="flex gap-2">
          <Input readOnly value={link} className="text-xs" />
          <Button type="button" variant="secondary" size="icon" onClick={copyLink}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-strivo-secondary">
          {referralCount} friend{referralCount !== 1 ? "s" : ""} joined via your link
        </p>
      </CardContent>
    </Card>
  );
}
