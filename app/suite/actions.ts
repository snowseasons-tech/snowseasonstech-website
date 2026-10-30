"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { blogStatuses, type BlogStatus } from "@/lib/suite/types";
import { slugify } from "@/lib/suite/slug";
import { BlogWriterError, writeBlogDraft } from "@/lib/suite/ai/blog-writer";
import { decryptToken } from "@/lib/social/crypto";
import { publishSocialPost, type Provider } from "@/lib/social/publish";

const slugPattern = /^[a-z0-9-]{1,120}$/;
const orgSlugPattern = /^[a-z0-9-]{3,40}$/;

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function normalizeSlug(value: string) {
  return value.trim().toLowerCase();
}

function errorMessage(error: { message: string }) {
  // Strip the "ERROR: " prefix Postgres adds to raised exceptions.
  return error.message.replace(/^ERROR:\s*/, "");
}

// Server Actions are reachable by direct POST, so each one checks auth through
// the database functions and redirects with a readable message on failure.
// redirect() throws, so it stays outside any try block.

export async function signIn(formData: FormData) {
  const email = text(formData, "email").trim();
  const password = text(formData, "password");

  if (!email.includes("@") || password.length < 8) {
    redirect(`/suite/login?error=${encodeURIComponent("Enter a valid email and a password of at least 8 characters.")}`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/suite/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/suite");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/suite/login");
}

export async function createOrganization(formData: FormData) {
  const name = text(formData, "name").trim();
  const slug = normalizeSlug(text(formData, "slug"));

  if (name.length < 2) {
    redirect(`/suite?error=${encodeURIComponent("Organization name must be at least 2 characters.")}`);
  }
  if (!orgSlugPattern.test(slug)) {
    redirect(`/suite?error=${encodeURIComponent("Slug must be 3 to 40 lowercase letters, numbers, or hyphens.")}`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("create_organization", { p_name: name, p_slug: slug });

  if (error) {
    redirect(`/suite?error=${encodeURIComponent(errorMessage(error))}`);
  }

  revalidatePath("/suite", "layout");
  redirect("/suite");
}

export async function addMember(formData: FormData) {
  const orgId = text(formData, "org_id");
  const email = text(formData, "email").trim();
  const role = text(formData, "role");

  if (!email.includes("@")) {
    redirect(`/suite?error=${encodeURIComponent("Enter the email address of an existing account.")}`);
  }
  if (role !== "admin" && role !== "member") {
    redirect(`/suite?error=${encodeURIComponent("Role must be admin or member.")}`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("add_organization_member", {
    p_org_id: orgId,
    p_email: email,
    p_role: role,
  });

  if (error) {
    redirect(`/suite?error=${encodeURIComponent(errorMessage(error))}`);
  }

  revalidatePath("/suite");
  redirect(`/suite?notice=${encodeURIComponent(`Added ${email} as ${role}.`)}`);
}

export async function createDraft(formData: FormData) {
  const orgId = text(formData, "org_id");
  const title = text(formData, "title").trim();
  const slug = normalizeSlug(text(formData, "slug")) || slugify(title);
  const body = text(formData, "body");

  if (!title) {
    redirect(`/suite/blog/new?error=${encodeURIComponent("Give the post a title.")}`);
  }
  if (!slugPattern.test(slug)) {
    redirect(`/suite/blog/new?error=${encodeURIComponent("Slug can only contain lowercase letters, numbers, and hyphens.")}`);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_blog_draft", {
    p_org_id: orgId,
    p_title: title,
    p_slug: slug,
    p_body: body,
  });

  if (error) {
    redirect(`/suite/blog/new?error=${encodeURIComponent(errorMessage(error))}`);
  }

  revalidatePath("/suite");
  redirect(`/suite/blog/${data}`);
}

export async function generateBlogDraft(formData: FormData) {
  const orgId = text(formData, "org_id");
  const orgName = text(formData, "org_name").trim() || "the company";
  const topic = text(formData, "topic").trim();
  const keyPoints = text(formData, "key_points");
  const length = text(formData, "length") === "short" ? "short" : "medium";
  const target = "/suite/blog/generate";

  if (topic.length < 3 || topic.length > 300) {
    redirect(`${target}?error=${encodeURIComponent("Topic must be between 3 and 300 characters.")}`);
  }
  if (keyPoints.length > 4000) {
    redirect(`${target}?error=${encodeURIComponent("Key points must be 4000 characters or fewer.")}`);
  }

  let draft;
  try {
    draft = await writeBlogDraft({ orgName, topic, keyPoints, length });
  } catch (error) {
    const message = error instanceof BlogWriterError ? error.message : "The draft could not be generated. Try again.";
    redirect(`${target}?error=${encodeURIComponent(message)}`);
  }

  // The draft goes through the same database function as a manual draft, so it
  // lands in the review queue with the same membership check.
  const title = draft.title.trim();
  const slug = slugify(draft.slug) || slugify(title);
  const supabase = await createSupabaseServerClient();
  const args = {
    p_org_id: orgId,
    p_title: title,
    p_slug: slug,
    p_body: draft.body,
    p_source: "ai",
    p_ai_model: draft.model,
  };

  let { data, error } = await supabase.rpc("create_blog_draft", args);

  // Model-written slugs can collide with an existing post. Retry once with a suffix.
  if (error && error.message.includes("duplicate key")) {
    const suffix = Math.random().toString(36).slice(2, 6);
    ({ data, error } = await supabase.rpc("create_blog_draft", {
      ...args,
      p_slug: `${slug.slice(0, 115)}-${suffix}`,
    }));
  }

  if (error) {
    redirect(`${target}?error=${encodeURIComponent(errorMessage(error))}`);
  }

  revalidatePath("/suite");
  redirect(`/suite/blog/${data}`);
}

// ---- Social accounts and posts -------------------------------------------------

export async function disconnectSocialAccount(formData: FormData) {
  const accountId = text(formData, "account_id");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("disconnect_social_account", { p_account_id: accountId });

  if (error) {
    redirect(`/suite/accounts?error=${encodeURIComponent(errorMessage(error))}`);
  }

  revalidatePath("/suite/accounts");
  redirect(`/suite/accounts?notice=${encodeURIComponent("Account disconnected.")}`);
}

export async function createSocialPost(formData: FormData) {
  const orgId = text(formData, "org_id");
  const accountId = text(formData, "account_id");
  const body = text(formData, "body").trim();
  const imageUrl = text(formData, "image_url").trim();
  const target = "/suite/social/new";

  if (!accountId) {
    redirect(`${target}?error=${encodeURIComponent("Choose an account to post to.")}`);
  }
  if (!body || body.length > 3000) {
    redirect(`${target}?error=${encodeURIComponent("Write between 1 and 3000 characters.")}`);
  }
  if (imageUrl && !/^https:\/\//.test(imageUrl)) {
    redirect(`${target}?error=${encodeURIComponent("Image URL must start with https://.")}`);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_social_post", {
    p_org_id: orgId,
    p_account_id: accountId,
    p_body: body,
    p_image_url: imageUrl || null,
  });

  if (error) {
    redirect(`${target}?error=${encodeURIComponent(errorMessage(error))}`);
  }

  revalidatePath("/suite/social");
  redirect(`/suite/social/${data}`);
}

export async function updateSocialPost(formData: FormData) {
  const postId = text(formData, "post_id");
  const body = text(formData, "body").trim();
  const imageUrl = text(formData, "image_url").trim();
  const target = `/suite/social/${postId}`;

  if (!body || body.length > 3000) {
    redirect(`${target}?error=${encodeURIComponent("Write between 1 and 3000 characters.")}`);
  }
  if (imageUrl && !/^https:\/\//.test(imageUrl)) {
    redirect(`${target}?error=${encodeURIComponent("Image URL must start with https://.")}`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("update_social_post", {
    p_post_id: postId,
    p_body: body,
    p_image_url: imageUrl || null,
  });

  if (error) {
    redirect(`${target}?error=${encodeURIComponent(errorMessage(error))}`);
  }

  revalidatePath("/suite/social");
  redirect(`${target}?saved=1`);
}

const socialMoves = ["in_review", "approved", "draft"] as const;

export async function moveSocialPost(formData: FormData) {
  const postId = text(formData, "post_id");
  const to = text(formData, "to");
  const target = `/suite/social/${postId}`;

  if (!(socialMoves as readonly string[]).includes(to)) {
    redirect(`${target}?error=${encodeURIComponent("Unknown status.")}`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("transition_social_post", { p_post_id: postId, p_to: to });

  if (error) {
    redirect(`${target}?error=${encodeURIComponent(errorMessage(error))}`);
  }

  revalidatePath("/suite/social");
  redirect(target);
}

// Publishing: lock the post, decrypt the token in memory, call the platform, then
// record the result. The token is never stored in plain text or logged.
export async function publishApprovedSocialPost(formData: FormData) {
  const postId = text(formData, "post_id");
  const target = `/suite/social/${postId}`;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("begin_social_publish", { p_post_id: postId });

  if (error) {
    redirect(`${target}?error=${encodeURIComponent(errorMessage(error))}`);
  }

  const job = (data as SocialPublishJob[] | null)?.[0];
  if (!job) {
    redirect(`${target}?error=${encodeURIComponent("Post not found.")}`);
  }

  let platformPostId: string | null = null;
  let failure: string | null = null;
  try {
    platformPostId = await publishSocialPost(job.provider_name, {
      token: decryptToken(job.account_token_ciphertext),
      externalId: job.account_external_id,
      body: job.post_body,
      imageUrl: job.post_image_url,
    });
  } catch (err) {
    failure = err instanceof Error ? err.message : "Publishing failed.";
  }

  const { error: finishError } = await supabase.rpc("finish_social_publish", {
    p_post_id: postId,
    p_platform_post_id: platformPostId,
    p_error: failure,
  });

  revalidatePath("/suite/social");
  if (finishError) {
    redirect(`${target}?error=${encodeURIComponent(errorMessage(finishError))}`);
  }
  if (failure) {
    redirect(`${target}?error=${encodeURIComponent(failure)}`);
  }
  redirect(`${target}?notice=${encodeURIComponent("Published.")}`);
}

type SocialPublishJob = {
  provider_name: Provider;
  account_external_id: string;
  account_token_ciphertext: string;
  post_body: string;
  post_image_url: string | null;
};

export async function saveDraft(formData: FormData) {
  const postId = text(formData, "post_id");
  const title = text(formData, "title").trim();
  const slug = normalizeSlug(text(formData, "slug"));
  const body = text(formData, "body");
  const target = `/suite/blog/${postId}`;

  if (!title) {
    redirect(`${target}?error=${encodeURIComponent("Give the post a title.")}`);
  }
  if (!slugPattern.test(slug)) {
    redirect(`${target}?error=${encodeURIComponent("Slug can only contain lowercase letters, numbers, and hyphens.")}`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("update_blog_draft", {
    p_post_id: postId,
    p_title: title,
    p_slug: slug,
    p_body: body,
  });

  if (error) {
    redirect(`${target}?error=${encodeURIComponent(errorMessage(error))}`);
  }

  revalidatePath("/suite");
  redirect(`${target}?saved=1`);
}

export async function moveBlogPost(formData: FormData) {
  const postId = text(formData, "post_id");
  const to = text(formData, "to");
  const target = `/suite/blog/${postId}`;

  if (!(blogStatuses as readonly string[]).includes(to)) {
    redirect(`${target}?error=${encodeURIComponent("Unknown status.")}`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("transition_blog_post", {
    p_post_id: postId,
    p_to: to as BlogStatus,
  });

  if (error) {
    redirect(`${target}?error=${encodeURIComponent(errorMessage(error))}`);
  }

  revalidatePath("/suite");
  redirect(target);
}
