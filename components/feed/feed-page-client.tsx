"use client";

import { formatDistanceToNow } from "date-fns";
import {
  Award,
  FileText,
  Heart,
  ImageIcon,
  Lightbulb,
  Loader2,
  MessageCircle,
  Send,
  Trophy,
  X,
} from "lucide-react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { FeedSidebarLeft } from "@/components/feed/feed-sidebar-left";
import { FeedSidebarRight } from "@/components/feed/feed-sidebar-right";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { getInitials } from "@/lib/utils";

const UploadButton = dynamic(
  () => import("@/lib/uploadthing").then((mod) => mod.UploadButton),
  {
    ssr: false,
    loading: () => (
      <Button type="button" size="sm" variant="outline" disabled>
        Image / PDF
      </Button>
    ),
  }
);

type PostType = "ACHIEVEMENT" | "DOUBT" | "KNOWLEDGE";

interface FeedPost {
  id: string;
  type: PostType;
  content: string;
  goalLabel: string;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  imageUrl: string | null;
  pdfUrl: string | null;
  pdfFileName: string | null;
  author: { id: string; name: string | null; profilePicUrl: string | null };
}

interface PendingMedia {
  imageUrl: string | null;
  pdfUrl: string | null;
  pdfFileName: string | null;
  previewImage: string | null;
}

const TYPE_META: Record<
  PostType,
  { label: string; icon: typeof Trophy; color: string }
> = {
  ACHIEVEMENT: { label: "Achievement", icon: Trophy, color: "text-amber-600" },
  DOUBT: { label: "Doubt", icon: MessageCircle, color: "text-blue-600" },
  KNOWLEDGE: { label: "Knowledge", icon: Lightbulb, color: "text-primary" },
};

export function FeedPageClient() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [postType, setPostType] = useState<PostType>("ACHIEVEMENT");
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, unknown[]>>({});
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [media, setMedia] = useState<PendingMedia>({
    imageUrl: null,
    pdfUrl: null,
    pdfFileName: null,
    previewImage: null,
  });
  const [uploading, setUploading] = useState(false);
  const [likingId, setLikingId] = useState<string | null>(null);
  const [commentingId, setCommentingId] = useState<string | null>(null);
  const [loadingCommentsId, setLoadingCommentsId] = useState<string | null>(null);

  function clearMedia() {
    setMedia({
      imageUrl: null,
      pdfUrl: null,
      pdfFileName: null,
      previewImage: null,
    });
  }

  const loadPosts = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/feed", { signal });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPosts(data.posts ?? []);
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadPosts(controller.signal);
    return () => controller.abort();
  }, [loadPosts]);

  async function handlePost() {
    if (content.trim().length < 5 && !media.imageUrl && !media.pdfUrl) {
      toast.error("Add text or attach a file");
      return;
    }
    setPosting(true);
    try {
      const res = await fetch("/api/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: postType,
          content,
          imageUrl: media.imageUrl,
          pdfUrl: media.pdfUrl,
          pdfFileName: media.pdfFileName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to post");
      setContent("");
      clearMedia();
      toast.success("Posted!");
      loadPosts();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to post");
    } finally {
      setPosting(false);
    }
  }

  async function toggleLike(postId: string) {
    if (likingId) return;
    setLikingId(postId);
    try {
      const res = await fetch(`/api/feed/${postId}/like`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? { ...p, likedByMe: data.liked, likeCount: data.likeCount }
              : p
          )
        );
      }
    } finally {
      setLikingId(null);
    }
  }

  async function loadComments(postId: string) {
    if (expandedComments === postId) {
      setExpandedComments(null);
      return;
    }
    setExpandedComments(postId);
    setLoadingCommentsId(postId);
    try {
      const res = await fetch(`/api/feed/${postId}/comments`);
      const data = await res.json();
      setComments((prev) => ({ ...prev, [postId]: data.comments ?? [] }));
    } finally {
      setLoadingCommentsId(null);
    }
  }

  async function submitComment(postId: string) {
    const text = commentText[postId]?.trim();
    if (!text || commentingId) return;
    setCommentingId(postId);
    try {
      const res = await fetch(`/api/feed/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      if (res.ok) {
        setCommentText((prev) => ({ ...prev, [postId]: "" }));
        const data = await res.json();
        setComments((prev) => ({
          ...prev,
          [postId]: [...(prev[postId] ?? []), data.comment],
        }));
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p
          )
        );
      }
    } finally {
      setCommentingId(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr_260px]">
      <div className="hidden lg:block">
        <FeedSidebarLeft />
      </div>

      <div className="space-y-4">
        <Card className="surface-card">
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-semibold text-strivo-text">Create a post</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(TYPE_META) as PostType[]).map((type) => {
                const meta = TYPE_META[type];
                const Icon = meta.icon;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setPostType(type)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      postType === type
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-strivo-line text-strivo-secondary"
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${meta.color}`} />
                    {meta.label}
                  </button>
                );
              })}
            </div>
            <Textarea
              placeholder="Share a milestone, ask a doubt, or drop a study tip..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
            />
            {media.previewImage && (
              <div className="relative inline-block">
                <Image
                  src={media.previewImage}
                  alt="Upload preview"
                  width={320}
                  height={200}
                  className="max-h-48 rounded-lg border border-strivo-line object-cover"
                />
                <button
                  type="button"
                  onClick={clearMedia}
                  className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white"
                  aria-label="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            {media.pdfUrl && (
              <div className="flex items-center justify-between rounded-lg border border-strivo-line bg-strivo-muted px-3 py-2 text-sm">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  {media.pdfFileName ?? "Attached PDF"}
                </span>
                <button type="button" onClick={clearMedia} aria-label="Remove PDF">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <UploadButton
                endpoint="feedMedia"
                appearance={{
                  button:
                    "ut-ready:bg-strivo-muted ut-ready:text-strivo-text text-xs font-medium px-3 py-2 rounded-lg border border-strivo-line bg-white",
                  allowedContent: "hidden",
                }}
                content={{
                  button({ ready }) {
                    if (!ready) return "Uploading...";
                    return (
                      <span className="flex items-center gap-1.5">
                        <ImageIcon className="h-4 w-4" />
                        Image / PDF
                      </span>
                    );
                  },
                }}
                onUploadBegin={() => setUploading(true)}
                onClientUploadComplete={(res) => {
                  setUploading(false);
                  const file = res[0];
                  if (!file) return;
                  if (file.type?.includes("pdf")) {
                    setMedia({
                      imageUrl: null,
                      pdfUrl: file.url,
                      pdfFileName: file.name,
                      previewImage: null,
                    });
                  } else {
                    setMedia({
                      imageUrl: file.url,
                      pdfUrl: null,
                      pdfFileName: null,
                      previewImage: file.url,
                    });
                  }
                  toast.success("File attached");
                }}
                onUploadError={(e) => {
                  setUploading(false);
                  toast.error(e.message);
                }}
              />
            </div>
            <Button
              onClick={handlePost}
              loading={posting}
              disabled={posting || uploading}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              Publish
            </Button>
          </CardContent>
        </Card>

        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        {error && (
          <Card className="surface-card">
            <CardContent className="p-6 text-center text-sm text-strivo-secondary">
              Failed to load feed.{" "}
              <button type="button" className="text-primary underline" onClick={() => loadPosts()}>
                Retry
              </button>
            </CardContent>
          </Card>
        )}

        {!loading &&
          !error &&
          posts.map((post) => {
            const meta = TYPE_META[post.type];
            const Icon = meta.icon;
            return (
              <Card key={post.id} className="surface-card">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <Avatar className="h-10 w-10">
                      {post.author.profilePicUrl && (
                        <AvatarImage src={post.author.profilePicUrl} alt="" />
                      )}
                      <AvatarFallback>{getInitials(post.author.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-strivo-text">
                          {post.author.name ?? "Student"}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {post.goalLabel}
                        </Badge>
                        <span className="inline-flex items-center gap-1 text-xs text-strivo-secondary">
                          <Icon className={`h-3.5 w-3.5 ${meta.color}`} />
                          {meta.label}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-strivo-secondary">
                        {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                      </p>
                      <p className="mt-3 text-sm text-strivo-text whitespace-pre-wrap">
                        {post.content}
                      </p>
                      {post.imageUrl && (
                        <div className="mt-3 overflow-hidden rounded-lg border border-strivo-line">
                          <Image
                            src={post.imageUrl}
                            alt="Post attachment"
                            width={600}
                            height={400}
                            className="max-h-96 w-full object-cover"
                          />
                        </div>
                      )}
                      {post.pdfUrl && (
                        <a
                          href={post.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 flex items-center gap-3 rounded-lg border border-strivo-line bg-strivo-muted p-3 transition-colors hover:bg-strivo-muted/80"
                        >
                          <FileText className="h-8 w-8 shrink-0 text-primary" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-strivo-text">
                              {post.pdfFileName ?? "PDF attachment"}
                            </p>
                            <p className="text-xs text-strivo-secondary">
                              Tap to open
                            </p>
                          </div>
                        </a>
                      )}
                      <div className="mt-4 flex gap-4">
                        <button
                          type="button"
                          onClick={() => toggleLike(post.id)}
                          disabled={likingId === post.id}
                          className={`flex items-center gap-1.5 text-sm ${
                            post.likedByMe ? "text-primary font-medium" : "text-strivo-secondary"
                          }`}
                        >
                          {likingId === post.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Heart className={`h-4 w-4 ${post.likedByMe ? "fill-current" : ""}`} />
                          )}
                          {post.likeCount}
                        </button>
                        <button
                          type="button"
                          onClick={() => loadComments(post.id)}
                          disabled={loadingCommentsId === post.id}
                          className="flex items-center gap-1.5 text-sm text-strivo-secondary"
                        >
                          {loadingCommentsId === post.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MessageCircle className="h-4 w-4" />
                          )}
                          {post.commentCount}
                        </button>
                      </div>
                      {expandedComments === post.id && (
                        <div className="mt-4 space-y-3 border-t border-strivo-line pt-4">
                          {(comments[post.id] as { id: string; content: string; author: { name: string | null } }[] | undefined)?.map((c) => (
                            <div key={c.id} className="text-sm">
                              <span className="font-medium">{c.author.name ?? "Student"}</span>
                              <span className="text-strivo-secondary"> · </span>
                              {c.content}
                            </div>
                          ))}
                          <div className="flex gap-2">
                            <input
                              className="flex-1 rounded-lg border border-strivo-line px-3 py-2 text-sm"
                              placeholder="Add a comment..."
                              value={commentText[post.id] ?? ""}
                              onChange={(e) =>
                                setCommentText((prev) => ({
                                  ...prev,
                                  [post.id]: e.target.value,
                                }))
                              }
                            />
                            <Button
                              size="sm"
                              onClick={() => submitComment(post.id)}
                              loading={commentingId === post.id}
                            >
                              Post
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

        {!loading && !error && posts.length === 0 && (
          <Card className="surface-card">
            <CardContent className="flex flex-col items-center py-12 text-center">
              <Award className="h-10 w-10 text-primary/40" />
              <p className="mt-3 font-medium">No posts yet</p>
              <p className="text-sm text-strivo-secondary">Be the first to share something study-related!</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="hidden lg:block">
        <FeedSidebarRight />
      </div>
    </div>
  );
}
