// Mijoz va server uchun umumiy turlar (Prisma importisiz).
import type { AvatarPayload } from "./leaderboard-meta";

export interface PersonDTO { username: string; level: number; country: string | null; title: string | null; avatar: AvatarPayload }
export type FriendRow = PersonDTO & { friendshipId: string };
export interface FriendsData { friends: FriendRow[]; incoming: FriendRow[]; outgoing: FriendRow[] }
export interface SearchHit extends PersonDTO { relation: "NONE" | "FRIEND" | "SENT" | "RECEIVED" }

export type TeamRole = "OWNER" | "OFFICER" | "MEMBER";
export const ROLE_LABELS: Record<TeamRole, string> = { OWNER: "Sardor", OFFICER: "Yordamchi", MEMBER: "A'zo" };

export interface TeamMemberDTO extends PersonDTO { role: TeamRole; isMe: boolean; xp: number }
export interface TeamAchievement { key: string; name: string; description: string; unlocked: boolean }
export interface TeamDetail {
  name: string; tag: string; description: string; isPublic: boolean; teamXp: number; maxMembers: number;
  rank: number; myRole: TeamRole; members: TeamMemberDTO[]; invited: string[]; achievements: TeamAchievement[];
}
export interface BrowseTeam {
  name: string; tag: string; description: string; members: number; maxMembers: number; teamXp: number;
  owner: string; joinable: boolean; reason: string | null;
}
export interface TeamInviteDTO { id: string; teamName: string; tag: string; by: string }
export interface TeamsPageData { mine: TeamDetail | null; invites: TeamInviteDTO[]; browse: BrowseTeam[] }