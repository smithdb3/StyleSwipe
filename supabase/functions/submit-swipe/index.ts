// supabase/functions/submit-swipe/index.ts
// Step 5.3 — Submit swipe, update tag scores, handle duplicates
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";
import { corsHeaders } from "../_shared/cors.ts";
import { updateTagScores } from "../_shared/tagScoring.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ message: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // 1. Parse POST body
    const body = await req.json() as {
      user_id?: string;
      item_id?: string;
      direction?: "like" | "skip";
    };

    const userId = body.user_id;
    const itemId = body.item_id;
    const direction = body.direction;

    if (!userId || !itemId || !direction) {
      return new Response(
        JSON.stringify({
          message: "Missing required fields: user_id, item_id, direction",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (direction !== "like" && direction !== "skip") {
      return new Response(
        JSON.stringify({ message: "direction must be 'like' or 'skip'" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 2. Validate JWT
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ message: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const jwt = authHeader.replace("Bearer ", "");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

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

    // 3. Insert swipe (handle duplicate: UNIQUE user_id, item_id)
    const { error: insertError } = await supabase.from("swipes").insert({
      user_id: userId,
      item_id: itemId,
      direction,
    });

    // Duplicate swipe = idempotent, return ok
    if (insertError) {
      const isDuplicate = insertError.code === "23505"; // unique_violation
      if (isDuplicate) {
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw insertError;
    }

    // 4. Load inspiration item tags
    const { data: item, error: itemError } = await supabase
      .from("inspiration_items")
      .select("tags")
      .eq("id", itemId)
      .single();

    if (itemError || !item?.tags) {
      // Item might have been deleted; swipe was recorded, return ok
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 5. Load profile tag_scores
    const { data: profile } = await supabase
      .from("profiles")
      .select("tag_scores")
      .eq("id", userId)
      .single();

    const tagScores = profile?.tag_scores ?? {};

    // 6. Update tag_scores and persist
    const newScores = updateTagScores(tagScores, item.tags, direction);

    await supabase
      .from("profiles")
      .update({ tag_scores: newScores })
      .eq("id", userId);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("submit-swipe error:", error);
    const message =
      error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ message, code: "SUBMIT_SWIPE_ERROR" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
