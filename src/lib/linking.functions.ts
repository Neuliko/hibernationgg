import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function genCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "HIB-";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export const createLinkCode = createServerFn({ method: "POST" })
  .inputValidator((input: { clerkUserId: string }) => {
    if (!input?.clerkUserId || typeof input.clerkUserId !== "string") {
      throw new Error("clerkUserId is required");
    }
    return input;
  })
  .handler(async ({ data }) => {
    const code = genCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error } = await supabaseAdmin
      .from("discord_links")
      .upsert(
        {
          clerk_user_id: data.clerkUserId,
          verification_code: code,
          expires_at: expiresAt,
          verified: false,
          discord_user_id: null,
          discord_username: null,
          linked_at: null,
        },
        { onConflict: "clerk_user_id" }
      );

    if (error) throw new Error(error.message);
    return { code, expiresAt };
  });

export const getMyLink = createServerFn({ method: "POST" })
  .inputValidator((input: { clerkUserId: string }) => input)
  .handler(async ({ data }) => {
    const { data: link } = await supabaseAdmin
      .from("discord_links")
      .select("*")
      .eq("clerk_user_id", data.clerkUserId)
      .maybeSingle();
    return { link };
  });

export const unlinkDiscord = createServerFn({ method: "POST" })
  .inputValidator((input: { clerkUserId: string }) => input)
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("discord_links")
      .delete()
      .eq("clerk_user_id", data.clerkUserId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
