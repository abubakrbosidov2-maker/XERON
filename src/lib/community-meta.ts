import type { PersonDTO } from "./social-meta";

export type ReportReason = "SPAM" | "ABUSE" | "INAPPROPRIATE" | "PRIVACY" | "OTHER";
export const REPORT_LABELS: Record<ReportReason, string> = {
  SPAM: "Spam yoki reklama",
  ABUSE: "Haqorat yoki bezorilik",
  INAPPROPRIATE: "Nomaqbul mazmun",
  PRIVACY: "Shaxsiy ma'lumot ulashilgan",
  OTHER: "Boshqa sabab",
};

export interface CommentDTO { id: string; content: string; createdAt: string; author: PersonDTO; isMine: boolean }

export interface PostDTO {
  id: string; kind: string; content: string; createdAt: string; author: PersonDTO; isMine: boolean;
  likes: number; liked: boolean; commentCount: number; comments: CommentDTO[];
  following: boolean; canFollow: boolean;
  achievement: { name: string; description: string; rarity: string } | null;
}

export interface FeedPage { posts: PostDTO[]; nextCursor: string | null }
export interface AchievementOption { id: string; name: string }