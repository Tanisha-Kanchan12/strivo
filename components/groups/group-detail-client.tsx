"use client";

import { formatDistanceToNow } from "date-fns";
import { Loader2, Send, Timer } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getInitials } from "@/lib/utils";

export function GroupDetailClient({ groupId }: { groupId: string }) {
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<{
    name: string;
    subject: string;
    members: { id: string; name: string | null; profilePicUrl: string | null }[];
    messages: { id: string; content: string; createdAt: string; author: { name: string | null } }[];
    targets: { id: string; task: string; isComplete: boolean; userName: string | null }[];
    focusSession: { status: string; endsAt: string | null; durationMinutes: number } | null;
  } | null>(null);
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/groups/${groupId}`);
    const data = await res.json();
    if (res.ok) setGroup(data.group);
    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  async function sendMessage() {
    if (!message.trim()) return;
    await fetch(`/api/groups/${groupId}/activity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "message", content: message }),
    });
    setMessage("");
    load();
  }

  async function addTarget() {
    if (!target.trim()) return;
    await fetch(`/api/groups/${groupId}/activity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "target", task: target }),
    });
    setTarget("");
    load();
  }

  async function startFocus() {
    await fetch(`/api/groups/${groupId}/focus`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start", durationMinutes: 25 }),
    });
    toast.success("Group focus timer started for all members!");
    load();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!group) {
    return (
      <Card className="surface-card">
        <CardContent className="p-8 text-center">
          <p>Group not found or you are not a member.</p>
          <Button asChild className="mt-4">
            <Link href="/home">Back to home</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="space-y-4">
        <Card className="surface-card">
          <CardHeader>
            <CardTitle>{group.name}</CardTitle>
            <p className="text-sm text-strivo-secondary">{group.subject}</p>
          </CardHeader>
          <CardContent className="space-y-4 max-h-80 overflow-y-auto">
            {group.messages.map((m) => (
              <div key={m.id} className="text-sm">
                <span className="font-medium">{m.author.name ?? "Member"}</span>
                <span className="text-strivo-secondary text-xs ml-2">
                  {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                </span>
                <p className="mt-0.5">{m.content}</p>
              </div>
            ))}
            <div className="flex gap-2 pt-2 border-t">
              <Input
                placeholder="Group chat..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <Button size="icon" onClick={sendMessage}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-4">
        <Card className="surface-card">
          <CardHeader>
            <CardTitle className="text-sm">Members</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {group.members.map((m) => (
              <div key={m.id} className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  {m.profilePicUrl && <AvatarImage src={m.profilePicUrl} alt="" />}
                  <AvatarFallback>{getInitials(m.name)}</AvatarFallback>
                </Avatar>
                <span className="text-sm">{m.name ?? "Member"}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="surface-card">
          <CardHeader>
            <CardTitle className="text-sm">Shared daily targets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {group.targets.map((t) => (
              <p key={t.id} className={`text-sm ${t.isComplete ? "line-through text-strivo-secondary" : ""}`}>
                {t.userName}: {t.task}
              </p>
            ))}
            <Input placeholder="Add target..." value={target} onChange={(e) => setTarget(e.target.value)} />
            <Button size="sm" variant="secondary" onClick={addTarget}>
              Add target
            </Button>
          </CardContent>
        </Card>

        <Card className="surface-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Timer className="h-4 w-4" />
              Group focus room
            </CardTitle>
          </CardHeader>
          <CardContent>
            {group.focusSession?.status === "RUNNING" ? (
              <p className="text-sm text-primary font-medium">
                Timer running · ends{" "}
                {group.focusSession.endsAt
                  ? formatDistanceToNow(new Date(group.focusSession.endsAt), { addSuffix: true })
                  : "soon"}
              </p>
            ) : (
              <Button onClick={startFocus} className="w-full">
                Start synced 25 min focus
              </Button>
            )}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
