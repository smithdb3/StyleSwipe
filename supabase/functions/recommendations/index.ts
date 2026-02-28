// supabase/functions/recommendations/index.ts
// Step 5.6 — Product recommendations by tag affinity; cold start when swipes < 5
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";
import { corsHeaders } from "../_shared/cors.ts";

function scoreProduct(
  product: { tags?: string[] },
  tagScores: Record<string, number>
): number {
  if (!product.tags || product.tags.length === 0) return 0;
  const sum = product.tags.reduce(
    (acc: number, tag: string) => acc + (tagScores[tag] ?? 0),
    0
  );
  return sum / product.tags.length;
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

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

    // Load profile (tag_scores)
    const { data: profile } = await supabase
      .from("profiles")
      .select("tag_scores")
      .eq("id", userId)
      .single();

    const tagScores = profile?.tag_scores ?? {};

    // Count swipes for cold start check
    const { count } = await supabase
      .from("swipes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    const swipeCount = count ?? 0;
    const isColdStart =
      Object.keys(tagScores).length === 0 || swipeCount < 5;

    if (isColdStart) {
      // Cold start: return random products
      const { data: products, error } = await supabase
        .from("products")
        .select("id, title, brand, image_url, price, buy_url, tags")
        .limit(Math.min(limit * 3, 100)); // Fetch extra, shuffle, trim

      if (error) throw error;

      const shuffled = shuffle(products ?? []);
      const items = shuffled.slice(0, limit).map((p) => ({
        id: p.id,
        title: p.title,
        brand: p.brand,
        image_url: p.image_url,
        price: typeof p.price === "number" ? p.price.toFixed(2) : String(p.price),
        buy_url: p.buy_url,
        tags: p.tags ?? [],
      }));

      return new Response(JSON.stringify({ items }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Warm path: score by tag affinity
    const { data: products, error } = await supabase
      .from("products")
      .select("id, title, brand, image_url, price, buy_url, tags")
      .limit(500); // Reasonable cap for scoring

    if (error) throw error;

    const scored = (products ?? []).map((p) => ({
      ...p,
      score: scoreProduct(p, tagScores),
    }));

    scored.sort((a, b) => b.score - a.score);

    const items = scored.slice(0, limit).map((p) => ({
      id: p.id,
      title: p.title,
      brand: p.brand,
      image_url: p.image_url,
      price: typeof p.price === "number" ? p.price.toFixed(2) : String(p.price),
      buy_url: p.buy_url,
      tags: p.tags ?? [],
    }));

    return new Response(JSON.stringify({ items }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("recommendations error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ message, code: "RECOMMENDATIONS_ERROR" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
