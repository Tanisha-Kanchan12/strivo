"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { UploadButton } from "@/lib/uploadthing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  profileUpdateSchema,
  type ProfileUpdateInput,
} from "@/lib/validations/profile";

interface ProfileEditFormProps {
  initialData: {
    bio: string;
    city: string;
    college: string;
    stream: string;
    profilePicUrl: string;
    subjects: string[];
    completion: number;
  };
}

export function ProfileEditForm({ initialData }: ProfileEditFormProps) {
  const router = useRouter();
  const [subjects, setSubjects] = useState<string[]>(initialData.subjects);
  const [subjectInput, setSubjectInput] = useState("");
  const [profilePicUrl, setProfilePicUrl] = useState(initialData.profilePicUrl);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      bio: initialData.bio,
      city: initialData.city,
      college: initialData.college,
      stream: initialData.stream,
      profilePicUrl: initialData.profilePicUrl,
      subjects: initialData.subjects,
    },
  });

  function addSubject() {
    const trimmed = subjectInput.trim();
    if (!trimmed || subjects.includes(trimmed) || subjects.length >= 10) return;
    const next = [...subjects, trimmed];
    setSubjects(next);
    form.setValue("subjects", next);
    setSubjectInput("");
  }

  function removeSubject(subject: string) {
    const next = subjects.filter((s) => s !== subject);
    setSubjects(next);
    form.setValue("subjects", next);
  }

  async function onSubmit(data: ProfileUpdateInput) {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, subjects, profilePicUrl }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Failed to save profile");

      toast.success("Profile updated!");
      router.push("/profile");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save profile"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 overflow-hidden rounded-full bg-strivo-muted">
          {profilePicUrl ? (
            <Image
              src={profilePicUrl}
              alt="Profile"
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-strivo-secondary">
              ?
            </div>
          )}
        </div>
        <UploadButton
          endpoint="profileImage"
          onClientUploadComplete={(res) => {
            const url = res?.[0]?.url;
            if (url) {
              setProfilePicUrl(url);
              form.setValue("profilePicUrl", url);
              toast.success("Photo uploaded!");
            }
          }}
          onUploadError={(error) => {
            toast.error(error.message);
          }}
          appearance={{
            button:
              "bg-secondary text-secondary-foreground text-sm font-medium px-4 py-2 rounded-lg ut-ready:bg-secondary ut-uploading:cursor-not-allowed",
          }}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" placeholder="Mumbai, Delhi, Bangalore..." {...form.register("city")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="college">College / School</Label>
          <Input id="college" placeholder="Your institution" {...form.register("college")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="stream">Stream</Label>
        <Input id="stream" placeholder="e.g. Science, Commerce, CSE" {...form.register("stream")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          placeholder="Tell potential study partners about yourself..."
          rows={4}
          {...form.register("bio")}
        />
      </div>

      <div className="space-y-3">
        <Label>Subjects</Label>
        <div className="flex gap-2">
          <Input
            value={subjectInput}
            onChange={(e) => setSubjectInput(e.target.value)}
            placeholder="Add a subject"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSubject();
              }
            }}
          />
          <Button type="button" variant="outline" size="icon" onClick={addSubject}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {subjects.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {subjects.map((subject) => (
              <Badge key={subject} variant="secondary" className="gap-1 pr-1">
                {subject}
                <button
                  type="button"
                  onClick={() => removeSubject(subject)}
                  className="ml-1 rounded-full p-0.5 hover:bg-strivo-muted"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" />
              Saving...
            </>
          ) : (
            "Save profile"
          )}
        </Button>
      </div>
    </form>
  );
}
