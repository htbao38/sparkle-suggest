import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

Phong cách:
- Thân thiện, chuyên nghiệp
- Trả lời bằng tiếng Việt
- Ngắn gọn, dễ hiểu
- Gợi ý sản phẩm cụ thể khi có thể`
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
