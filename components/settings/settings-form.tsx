"use client";

import type { ProfileVisibility, StudyGoal } from "@prisma/client";
import { Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { UploadButton } from "@/lib/uploadthing";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  SelectableChip,
  SelectableChipGrid,
} from "@/components/ui/selectable-chip";
import {
  LANGUAGE_OPTIONS,
  PROFILE_VISIBILITY_OPTIONS,
  STUDY_GOAL_OPTIONS,
} from "@/lib/constants/onboarding";
import { MentorSettingsCard } from "@/components/settings/mentor-settings-card";

interface SettingsData {
  settings: {
    cityMode: boolean;
    locationAccess: boolean;
    girlsOnlyMode: boolean;
    language: string;
    notifyStreakUpdates: boolean;
    notifySessionReminders: boolean;
    notifyNewMatches: boolean;
    notifyConnectAccepted: boolean;
    notifyConnectExpired: boolean;
    notifyShieldUsed: boolean;
    notifyNewMessages: boolean;
    notifyStudyingNow: boolean;
    notifyStreakMilestones: boolean;
    notifyAiNudge: boolean;
  };
  profile: { visibility: ProfileVisibility };
  onboarding: { goal: StudyGoal | null };
}

interface BlockEntry {
  id: string;
  blockedId: string;
  name: string | null;
  city: string | null;
}

interface SettingsFormProps {
  initialData: SettingsData;
  initialBlocks: BlockEntry[];
  isVerified: boolean;
}

export function SettingsForm({
  initialData,
  initialBlocks,
  isVerified,
}: SettingsFormProps) {
  const router = useRouter();
  const { signOut } = useClerk();
  const [data, setData] = useState(initialData);
  const [blocks, setBlocks] = useState(initialBlocks);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<StudyGoal | null>(
    initialData.onboarding.goal
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const patchSettings = useCallback(
    async (payload: Record<string, unknown>, key: string) => {
      setSavingKey(key);
      try {
        const res = await fetch("/api/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error ?? "Failed to save");
        setData({
          settings: result.settings,
          profile: result.profile,
          onboarding: result.onboarding,
        });
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to save settings"
        );
      } finally {
        setSavingKey(null);
      }
    },
    []
  );

  function handleToggle(
    field: keyof SettingsData["settings"],
    value: boolean
  ) {
    setData((prev) => ({
      ...prev,
      settings: { ...prev.settings, [field]: value },
    }));
    patchSettings({ [field]: value }, field);
  }

  async function handleUnblock(blockId: string) {
    try {
      const res = await fetch(`/api/blocks/${blockId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to unblock");
      setBlocks((prev) => prev.filter((b) => b.id !== blockId));
      toast.success("User unblocked");
    } catch {
      toast.error("Failed to unblock user");
    }
  }

  async function handleVerifyStudent(url: string) {
    setSavingKey("verify");
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify-student", documentUrl: url }),
      });
      if (!res.ok) throw new Error("Verification failed");
      toast.success("Student ID verified!");
      router.refresh();
    } catch {
      toast.error("Failed to verify student ID");
    } finally {
      setSavingKey(null);
    }
  }

  async function handleDeleteAccount() {
    setIsDeleting(true);
    try {
      const res = await fetch("/api/users/me", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete account");
      await signOut({ redirectUrl: "/login" });
    } catch {
      toast.error("Failed to delete account");
      setIsDeleting(false);
    }
  }

  async function handleGoalUpdate() {
    if (!selectedGoal) return;
    await patchSettings({ goal: selectedGoal }, "goal");
    setGoalDialogOpen(false);
    toast.success("Goal updated. Your match pool will refresh.");
  }

  const notificationToggles: {
    key: keyof SettingsData["settings"];
    label: string;
  }[] = [
    { key: "notifyStreakUpdates", label: "Streak updates" },
    { key: "notifySessionReminders", label: "Session reminders" },
    { key: "notifyNewMatches", label: "New matches" },
    { key: "notifyConnectAccepted", label: "Connect accepted" },
    { key: "notifyConnectExpired", label: "Connect expired" },
    { key: "notifyShieldUsed", label: "Streak shield used" },
    { key: "notifyNewMessages", label: "New messages" },
    { key: "notifyStudyingNow", label: "Are you studying now?" },
    { key: "notifyStreakMilestones", label: "Streak milestones" },
    { key: "notifyAiNudge", label: "AI progress nudges" },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-strivo-text">Settings</h1>
        <p className="mt-1 text-sm text-strivo-secondary">
          Manage your account, matching preferences, and privacy
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Edit profile</p>
              <p className="text-xs text-strivo-secondary">
                Bio, city, college, subjects
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/profile/edit">Edit</Link>
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Update goal</p>
              <p className="text-xs text-strivo-secondary">
                Refreshes your matching pool
              </p>
            </div>
            <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Change
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Update your goal</DialogTitle>
                  <DialogDescription>
                    Your existing pairs will remain connected.
                  </DialogDescription>
                </DialogHeader>
                <SelectableChipGrid columns={2}>
                  {STUDY_GOAL_OPTIONS.map((option) => (
                    <SelectableChip
                      key={option.value}
                      label={option.label}
                      selected={selectedGoal === option.value}
                      onClick={() => setSelectedGoal(option.value)}
                    />
                  ))}
                </SelectableChipGrid>
                <DialogFooter>
                  <Button
                    onClick={handleGoalUpdate}
                    disabled={!selectedGoal || savingKey === "goal"}
                  >
                    {savingKey === "goal" ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      "Save goal"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Verify student ID</p>
              <p className="text-xs text-strivo-secondary">
                {isVerified ? "Verified ✓" : "Upload your student ID card"}
              </p>
            </div>
            {!isVerified && (
              <UploadButton
                endpoint="studentId"
                onClientUploadComplete={(res) => {
                  const url = res?.[0]?.url;
                  if (url) handleVerifyStudent(url);
                }}
                onUploadError={(error) => {
                  toast.error(error.message);
                }}
                appearance={{
                  button:
                    "bg-secondary text-secondary-foreground text-sm font-medium px-3 py-1.5 rounded-lg ut-ready:bg-secondary",
                }}
              />
            )}
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Label>Language</Label>
            <div className="flex gap-2">
              {LANGUAGE_OPTIONS.map((lang) => (
                <Button
                  key={lang.value}
                  size="sm"
                  variant={
                    data.settings.language === lang.value ? "default" : "outline"
                  }
                  onClick={() => {
                    setData((prev) => ({
                      ...prev,
                      settings: { ...prev.settings, language: lang.value },
                    }));
                    patchSettings({ language: lang.value }, "language");
                  }}
                >
                  {lang.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <MentorSettingsCard />

      <Card>
        <CardHeader>
          <CardTitle>Matching</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingToggle
            label="City mode"
            description="Prioritize matches in your city"
            checked={data.settings.cityMode}
            onCheckedChange={(v) => handleToggle("cityMode", v)}
            loading={savingKey === "cityMode"}
          />
          <SettingToggle
            label="Location access"
            description="Use your location for nearby matches"
            checked={data.settings.locationAccess}
            onCheckedChange={(v) => handleToggle("locationAccess", v)}
            loading={savingKey === "locationAccess"}
          />
          <SettingToggle
            label="Girls only mode"
            description="Only visible to others with this mode on"
            checked={data.settings.girlsOnlyMode}
            onCheckedChange={(v) => handleToggle("girlsOnlyMode", v)}
            loading={savingKey === "girlsOnlyMode"}
          />
          <Separator />
          <div className="space-y-3">
            <Label>Profile visibility</Label>
            <SelectableChipGrid columns={1}>
              {PROFILE_VISIBILITY_OPTIONS.map((option) => (
                <SelectableChip
                  key={option.value}
                  label={option.label}
                  description={option.description}
                  selected={data.profile.visibility === option.value}
                  onClick={() => {
                    setData((prev) => ({
                      ...prev,
                      profile: { visibility: option.value },
                    }));
                    patchSettings({ visibility: option.value }, "visibility");
                  }}
                />
              ))}
            </SelectableChipGrid>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Choose what you want to be notified about</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {notificationToggles.map(({ key, label }) => (
            <SettingToggle
              key={key}
              label={label}
              checked={data.settings[key] as boolean}
              onCheckedChange={(v) => handleToggle(key, v)}
              loading={savingKey === key}
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Privacy</CardTitle>
          <CardDescription>Blocked users cannot see or contact you</CardDescription>
        </CardHeader>
        <CardContent>
          {blocks.length === 0 ? (
            <p className="text-sm text-strivo-secondary">No blocked users</p>
          ) : (
            <div className="space-y-3">
              {blocks.map((block) => (
                <div
                  key={block.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {block.name ?? "Unknown user"}
                    </p>
                    {block.city && (
                      <p className="text-xs text-strivo-secondary">
                        {block.city}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnblock(block.id)}
                  >
                    Unblock
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
          <CardDescription>
            Permanently delete your account and all data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4" />
                Delete account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete your account?</DialogTitle>
                <DialogDescription>
                  This action is permanent. All your data, pairs, messages, and
                  streaks will be deleted.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    "Yes, delete my account"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}

function SettingToggle({
  label,
  description,
  checked,
  onCheckedChange,
  loading,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  loading?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && (
          <p className="text-xs text-strivo-secondary">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {loading && <Loader2 className="h-3 w-3 animate-spin text-strivo-secondary" />}
        <Switch checked={checked} onCheckedChange={onCheckedChange} />
      </div>
    </div>
  );
}
