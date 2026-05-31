import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PairStudyBoard } from "@/components/pairs/pair-study-board";
import { Button } from "@/components/ui/button";
import { requireDbUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export default async function PairDetailPage({
  params,
}: {
  params: Promise<{ pairId: string }>;
}) {
  const { user } = await requireDbUser();
  const { pairId } = await params;

  const pair = await prisma.connectedPair.findUnique({
    where: { id: pairId },
    select: { user1Id: true, user2Id: true },
  });

  if (!pair) notFound();
  if (pair.user1Id !== user.id && pair.user2Id !== user.id) notFound();

  const partnerId = pair.user1Id === user.id ? pair.user2Id : pair.user1Id;

  const [myProfile, partnerProfile] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: user.id }, select: { city: true } }),
    prisma.profile.findUnique({ where: { userId: partnerId }, select: { city: true } }),
  ]);

  const sameCity =
    Boolean(myProfile?.city && partnerProfile?.city) &&
    myProfile!.city!.toLowerCase() === partnerProfile!.city!.toLowerCase();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/pairs">
          <ArrowLeft className="h-4 w-4" />
          All pairs
        </Link>
      </Button>
      <PairStudyBoard pairId={pairId} sameCity={sameCity} />
    </div>
  );
}
