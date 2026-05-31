import { GroupDetailClient } from "@/components/groups/group-detail-client";

export default async function GroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="animate-fade-in">
      <GroupDetailClient groupId={id} />
    </div>
  );
}
