import { notFound } from "next/navigation";
import { FocusRoom } from "@/components/focus/focus-room";
import { requireDbUser } from "@/lib/auth";
import { verifyPairMembership } from "@/lib/chat";

export default async function FocusPage({
  params,
}: {
  params: Promise<{ pairId: string }>;
}) {
  const { user } = await requireDbUser();
  const { pairId } = await params;

  const membership = await verifyPairMembership(user.id, pairId);
  if (!membership) notFound();

  return (
    <FocusRoom
      pairId={pairId}
      currentUserId={user.id}
      partner={{
        id: membership.partner.id,
        name: membership.partner.name,
      }}
    />
  );
}
