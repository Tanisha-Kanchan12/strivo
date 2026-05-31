import { SettingsForm } from "@/components/settings/settings-form";
import { requireDbUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export default async function SettingsPage() {
  const { user } = await requireDbUser();

  const blocks = await prisma.block.findMany({
    where: { blockerId: user.id },
    include: {
      blocked: {
        select: { id: true, name: true, profile: { select: { city: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!user.settings) {
    throw new Error("User settings not found");
  }

  return (
    <SettingsForm
      isVerified={user.profile?.isVerified ?? false}
      initialData={{
        settings: user.settings,
        profile: { visibility: user.profile?.visibility ?? "OPEN" },
        onboarding: { goal: user.onboarding?.goal ?? null },
      }}
      initialBlocks={blocks.map((block) => ({
        id: block.id,
        blockedId: block.blockedId,
        name: block.blocked.name,
        city: block.blocked.profile?.city ?? null,
      }))}
    />
  );
}
