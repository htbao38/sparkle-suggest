import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch products from database to give chatbot real product knowledge
    let productContext = "";
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: products } = await supabase
        .from("products")
        .select("name, slug, price, original_price, category, material, is_featured, stock")
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .limit(50);

      if (products && products.length > 0) {
        const categoryMap: Record<string, string> = {
          nhan: "Nhẫn", day_chuyen: "Dây chuyền", vong_tay: "Vòng tay",
          bong_tai: "Bông tai", lac: "Lắc", charm: "Charm",
          nhan_cuoi: "Nhẫn cưới", trang_suc_cuoi: "Trang sức cưới",
        };
        const materialMap: Record<string, string> = {
          gold_24k: "Vàng 24K", gold_18k: "Vàng 18K", gold_14k: "Vàng 14K",
          silver: "Bạc", platinum: "Bạch kim", diamond: "Kim cương",
          pearl: "Ngọc trai", gemstone: "Đá quý",
        };

        const productList = products.map(p => {
          const price = new Intl.NumberFormat("vi-VN").format(p.price) + "đ";
          const cat = categoryMap[p.category] || p.category;
          const mat = materialMap[p.material] || p.material;
          const featured = p.is_featured ? " ⭐" : "";
          const stock = p.stock > 0 ? `còn ${p.stock}` : "hết hàng";
          return `- ${p.name} | ${cat} | ${mat} | ${price} | ${stock}${featured} | /san-pham/${p.slug}`;
        }).join("\n");

        productContext = `\n\nDanh sách sản phẩm hiện có:\n${productList}\n\nKhi gợi ý sản phẩm, hãy đề cập tên và giá cụ thể. Gợi ý link sản phẩm dạng: /san-pham/[slug]`;
      }
    } catch (e) {
      console.error("Error fetching products for chatbot:", e);
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Bạn là trợ lý tư vấn trang sức của LUXE JEWELRY - cửa hàng trang sức cao cấp tại Việt Nam.

Nhiệm vụ:
- Tư vấn chọn trang sức phù hợp (nhẫn, dây chuyền, vòng tay, bông tai, lắc, charm, nhẫn cưới, trang sức cưới)
- Tư vấn chất liệu (Vàng 24K/18K/14K, Bạc, Bạch kim, Kim cương, Ngọc trai, Đá quý)
- Hướng dẫn bảo quản trang sức
- Tư vấn quà tặng theo dịp
- Giải đáp thắc mắc về sản phẩm, chính sách đổi trả, vận chuyển
- Gợi ý sản phẩm cụ thể từ danh sách sản phẩm khi khách hỏi

Phong cách:
- Thân thiện, chuyên nghiệp
- Trả lời bằng tiếng Việt
- Ngắn gọn, dễ hiểu
- Khi gợi ý sản phẩm, nêu tên, giá và link cụ thể${productContext}`
          },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Hệ thống đang bận, vui lòng thử lại sau." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Dịch vụ tạm ngưng, vui lòng thử lại sau." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Lỗi hệ thống" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "Xin lỗi, tôi không thể trả lời lúc này.";

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("chatbot error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
