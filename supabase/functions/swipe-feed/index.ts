// supabase/functions/swipe-feed/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Validate JWT
    const url = new URL(req.url);
    const userId = url.searchParams.get("user_id");
    const limit = Math.min(
      Math.max(parseInt(url.searchParams.get("limit") || "20", 10) || 20, 1),
      50
    );

    if (!userId) {
      return new Response(
        JSON.stringify({ message: "Missing user_id query param" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ message: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const jwt = authHeader.replace("Bearer ", "");

    // 2. Initialize Supabase client with service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify JWT and ensure user_id matches
    const {
      data: { user },
      error: jwtError,
    } = await supabase.auth.getUser(jwt);
    if (jwtError || !user || user.id !== userId) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Load profile (tag_scores)
    const { data: profile } = await supabase
      .from("profiles")
      .select("tag_scores")
      .eq("id", userId)
      .single();

    const tagScores = profile?.tag_scores || {};

    // 4. Get seen item_ids
    const { data: seenData } = await supabase
      .from("swipes")
      .select("item_id")
      .eq("user_id", userId)
      .limit(5000); // Bound to avoid large subquery

    const seenIds = seenData?.map((s: any) => s.item_id) || [];

    // 5. Fetch unseen inspiration items
    let query = supabase
      .from("inspiration_items")
      .select("*")
      .limit(limit);

    if (seenIds.length > 0) {
      // PostgREST format: (uuid1,uuid2) — UUIDs need double quotes
      query = query.not(
        "id",
        "in",
        `(${seenIds.map((id) => `"${id}"`).join(",")})`
      );
    }

    const { data: items } = await query;

    // 6. Score and sort (in JavaScript)
    const scored = (items ?? []).map((item: any) => ({
      ...item,
      score: scoreItem(item, tagScores),
    }));

    scored.sort((a, b) => b.score - a.score);

    const result = scored.map((item: any) => ({
      id: item.id,
      image_url: item.image_url,
      tags: item.tags,
      source: item.source,
    }));

    return new Response(JSON.stringify({ items: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("swipe-feed error:", error);
    const message =
      error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ message, code: "FEED_ERROR" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Helper: score an item by average tag affinity
function scoreItem(item: any, tagScores: any): number {
  if (!item.tags || item.tags.length === 0) return 0;
  const sum = item.tags.reduce((acc: number, tag: string) => {
    return acc + (tagScores[tag] ?? 0);
  }, 0);
  return sum / item.tags.length;
}