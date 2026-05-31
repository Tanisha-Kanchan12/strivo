"use client";

import { Loader2, MapPin, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HACKATHON_ROLE_LABELS } from "@/lib/hackathon";
import { asHackathonRoles } from "@/lib/prisma-json";
import { hackathonRoleSchema } from "@/lib/validations/hackathon";
import type { HackathonRole } from "@prisma/client";
import { getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";

const postFormSchema = z.object({
  hackathonName: z.string().min(2, "Name required"),
  rolesNeeded: z.array(hackathonRoleSchema).min(1, "Select at least one role"),
  cityPreference: z.string().optional(),
  deadline: z.string().min(1, "Deadline required"),
});

type PostFormValues = z.infer<typeof postFormSchema>;

const ALL_ROLES = Object.keys(HACKATHON_ROLE_LABELS) as HackathonRole[];

interface HackathonPostItem {
  id: string;
  hackathonName: string;
  rolesNeeded: HackathonRole[];
  cityPreference: string | null;
  deadline: string;
  user: {
    id: string;
    name: string | null;
    profile: { city: string | null; profilePicUrl: string | null } | null;
  };
  applications: { applicantId: string }[];
}

interface HackathonBoardProps {
  currentUserId: string;
}

export function HackathonBoard({ currentUserId }: HackathonBoardProps) {
  const router = useRouter();
  const [posts, setPosts] = useState<HackathonPostItem[]>([]);
  const [roleFilter, setRoleFilter] = useState<HackathonRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [postOpen, setPostOpen] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const form = useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      hackathonName: "",
      rolesNeeded: [],
      cityPreference: "",
      deadline: "",
    },
  });

  const fetchPosts = useCallback(async () => {
    const params = roleFilter ? `?role=${roleFilter}` : "";
    const res = await fetch(`/api/hackathon/posts${params}`);
    const data = await res.json();
    if (res.ok) setPosts(data.posts);
  }, [roleFilter]);

  useEffect(() => {
    setIsLoading(true);
    fetchPosts().finally(() => setIsLoading(false));
  }, [fetchPosts]);

  async function onSubmit(values: PostFormValues) {
    const res = await fetch("/api/hackathon/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Could not create post");
      return;
    }
    toast.success("Hackathon listing posted!");
    setPostOpen(false);
    form.reset();
    fetchPosts();
  }

  async function handleApply(postId: string) {
    setApplyingId(postId);
    try {
      const res = await fetch(`/api/hackathon/posts/${postId}/apply`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      if (data.pairId) {
        router.push(`/chat/${data.pairId}`);
      }
      toast.success("Application sent. Chat opened!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not apply"
      );
    } finally {
      setApplyingId(null);
    }
  }

  function toggleRole(role: HackathonRole) {
    const current = form.getValues("rolesNeeded");
    if (current.includes(role)) {
      form.setValue(
        "rolesNeeded",
        current.filter((r) => r !== role)
      );
    } else {
      form.setValue("rolesNeeded", [...current, role]);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Hackathon Team Board</h2>
          <p className="text-sm text-strivo-secondary">
            Find teammates or post your team needs
          </p>
        </div>
        <Button size="sm" onClick={() => setPostOpen(true)}>
          <Plus className="h-4 w-4" />
          Post
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setRoleFilter(null)}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
            !roleFilter ? "chip-active" : "chip-inactive"
          )}
        >
          All roles
        </button>
        {ALL_ROLES.map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => setRoleFilter(role)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
              roleFilter === role ? "chip-active" : "chip-inactive"
            )}
          >
            {HACKATHON_ROLE_LABELS[role]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-strivo-secondary" />
        </div>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-strivo-secondary">
            No open listings yet. Be the first to post!
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {posts.map((post) => {
            const isOwn = post.user.id === currentUserId;
            const hasApplied = post.applications.some(
              (a) => a.applicantId === currentUserId
            );

            return (
              <Card key={post.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      {post.user.profile?.profilePicUrl && (
                        <AvatarImage
                          src={post.user.profile.profilePicUrl}
                          alt={post.user.name ?? ""}
                        />
                      )}
                      <AvatarFallback>
                        {getInitials(post.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold">{post.hackathonName}</h3>
                      <p className="text-xs text-strivo-secondary">
                        by {post.user.name ?? "Student"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {asHackathonRoles(post.rolesNeeded).map((role) => (
                      <Badge key={role} variant="secondary" className="text-xs">
                        {HACKATHON_ROLE_LABELS[role]}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs text-strivo-secondary">
                    {post.cityPreference && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {post.cityPreference}
                      </span>
                    )}
                    <span>
                      Deadline{" "}
                      {new Date(post.deadline).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  {!isOwn && (
                    <Button
                      className="w-full"
                      size="sm"
                      variant={hasApplied ? "secondary" : "default"}
                      disabled={hasApplied || applyingId === post.id}
                      onClick={() => handleApply(post.id)}
                    >
                      {applyingId === post.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : hasApplied ? (
                        "Applied"
                      ) : (
                        "Apply & Chat"
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={postOpen} onOpenChange={setPostOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Post a hackathon listing</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hackathonName">Hackathon name</Label>
              <Input
                id="hackathonName"
                {...form.register("hackathonName")}
                placeholder="e.g. Smart India Hackathon 2026"
              />
            </div>
            <div className="space-y-2">
              <Label>Roles needed</Label>
              <div className="flex flex-wrap gap-2">
                {ALL_ROLES.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleRole(role)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium border",
                      form.watch("rolesNeeded").includes(role)
                        ? "border-strivo-mid bg-strivo-muted text-strivo-secondary"
                        : "border-border"
                    )}
                  >
                    {HACKATHON_ROLE_LABELS[role]}
                  </button>
                ))}
              </div>
              {form.formState.errors.rolesNeeded && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.rolesNeeded.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cityPreference">City preference (optional)</Label>
              <Input
                id="cityPreference"
                {...form.register("cityPreference")}
                placeholder="e.g. Bangalore"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Input id="deadline" type="date" {...form.register("deadline")} />
            </div>
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Post listing"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
