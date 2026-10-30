import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Membership } from "@/lib/suite/types";

// Returns the signed-in user's first organization membership, or null when the
// user has no organization yet. Phase 1 supports one org per user in the UI.
export async function getCurrentMembership(): Promise<Membership | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data } = await supabase
    .from("organization_members")
    .select("org_id, role, organizations ( id, name, slug )")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return (data as Membership | null) ?? null;
}
