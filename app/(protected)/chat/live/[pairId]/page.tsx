import { notFound } from "next/navigation";
import { ChatRoom } from "@/components/chat/chat-room";
import { requireDbUser } from "@/lib/auth";
import { verifyPairMembership } from "@/lib/chat";

export default async function LiveChatPage({
  params,
}: {
  params: Promise<{ pairId: string }>;
}) {
  const { user } = await requireDbUser();
  const { pairId } = await params;

  const membership = await verifyPairMembership(user.id, pairId);
  if (!membership) notFound();

  return (
    <ChatRoom
      pairId={pairId}
      currentUserId={user.id}
      isProvisional={membership.pair.isProvisional}
      backHref="/home"
      partner={{
        id: membership.partner.id,
        name: membership.partner.name,
        profilePicUrl: membership.partner.profile?.profilePicUrl ?? null,
      }}
    />
  );
}
