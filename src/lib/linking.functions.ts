import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function genCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "HIB-";
  for (let i = 0; i < 6; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

/**
 * Create a verification code that the bot will claim via /link CODE.
 * We accept the Clerk userId from the client because Clerk JWTs are not
 * verifiable inside Supabase RLS in this template — server validation
 * happens at the Clerk middleware layer in production.
 */
export const createLinkCode = createServerFn({ method: "POST" })
  .inputValidator((input: { clerkUserId: string }) => {
    if (!input?.clerkUserId || typeof input.clerkUserId !== "string") {
      throw new Error("clerkUserId is required");
    }
    return input;
  })
  .handler(async ({ data }) => {
    const code = genCode();
    // Pseudo-uuid derived from the Clerk user id so we can look it up later.
    // We use a deterministic UUID v5-ish hash so repeat calls update the same row.
    const userUuid = await clerkIdToUuid(data.clerkUserId);

    const { error } = await supabaseAdmin
      .from("discord_links")
      .upsert(
        {
          user_id: userUuid,
          verification_code: code,
          verified: false,
        },
        { onConflict: "user_id" }
      );
    if (error) throw new Error(error.message);

    return { code };
  });

export const getMyLink = createServerFn({ method: "POST" })
  .inputValidator((input: { clerkUserId: string }) => input)
  .handler(async ({ data }) => {
    const userUuid = await clerkIdToUuid(data.clerkUserId);
    const { data: link } = await supabaseAdmin
      .from("discord_links")
      .select("*")
      .eq("user_id", userUuid)
      .maybeSingle();
    return { link };
  });

async function clerkIdToUuid(clerkId: string): Promise<string> {
  // SHA-256 → first 16 bytes → format as UUID v4-ish. Deterministic per Clerk id.
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", enc.encode("clerk:" + clerkId));
  const b = new Uint8Array(buf).slice(0, 16);
  // Set version (4) and variant bits
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const hex = Array.from(b).map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
