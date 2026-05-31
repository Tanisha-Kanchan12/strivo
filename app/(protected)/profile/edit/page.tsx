import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProfileEditForm } from "@/components/profile/profile-edit-form";
import { requireDbUser } from "@/lib/auth";
import { calculateProfileCompletion } from "@/lib/profile";
import prisma from "@/lib/prisma";

export default async function ProfileEditPage() {
  const { user } = await requireDbUser();

  const subjects = await prisma.subject.findMany({
    where: { userId: user.id },
    orderBy: { subjectName: "asc" },
  });

  const completion = calculateProfileCompletion({
    profile: user.profile,
    subjectsCount: subjects.length,
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Edit Profile</h1>
          <p className="text-strivo-secondary">
            {completion}% complete. Fill in the rest to get better matches.
          </p>
        </div>
        <Button variant="ghost" asChild>
          <Link href="/profile">Back</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile details</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileEditForm
            initialData={{
              bio: user.profile?.bio ?? "",
              city: user.profile?.city ?? "",
              college: user.profile?.college ?? "",
              stream: user.profile?.stream ?? "",
              profilePicUrl: user.profile?.profilePicUrl ?? "",
              subjects: subjects.map((s) => s.subjectName),
              completion,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
