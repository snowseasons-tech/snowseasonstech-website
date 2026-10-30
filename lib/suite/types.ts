export const blogStatuses = ["draft", "in_review", "approved", "rejected", "published"] as const;

export type BlogStatus = (typeof blogStatuses)[number];

export const statusLabels: Record<BlogStatus, string> = {
  draft: "Draft",
  in_review: "In review",
  approved: "Approved",
  rejected: "Rejected",
  published: "Published",
};

export type BlogPost = {
  id: string;
  org_id: string;
  title: string;
  slug: string;
  body: string;
  status: BlogStatus;
  author_id: string | null;
  source: "manual" | "ai";
  ai_model: string | null;
  reviewed_at: string | null;
  published_at: string | null;
  updated_at: string;
};

export type Membership = {
  org_id: string;
  role: "owner" | "admin" | "member";
  organizations: { id: string; name: string; slug: string } | null;
};
