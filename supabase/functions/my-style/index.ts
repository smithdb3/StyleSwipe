// supabase/functions/my-style/index.ts
// Step 5.5 — Return inspiration items user swiped 'like' on, most recent first
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ message: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("user_id");

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

    // Join swipes with inspiration_items, filter by user and direction='like', order by created_at desc
    const { data: rows, error } = await supabase
      .from("swipes")
      .select(`
        inspiration_items (
          id,
          image_url,
          tags,
          source
        )
      `)
      .eq("user_id", userId)
      .eq("direction", "like")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    // Extract items from join result (PostgREST may return nested row under table name or FK column); filter out nulls (deleted inspiration items)
    const items = (rows ?? [])
      .map((r: { item_id?: Record<string, unknown> | null; inspiration_items?: Record<string, unknown> | null }) =>
        r.item_id ?? r.inspiration_items
      )
      .filter(Boolean) as Array<{ id: string; image_url: string; tags: string[]; source?: string }>;

    return new Response(JSON.stringify({ items }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("my-style error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ message, code: "MY_STYLE_ERROR" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
