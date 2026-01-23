import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { action, email, password } = await req.json();

    if (action === "create_admin") {
      // Create admin user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email || "admin@luxejewelry.vn",
        password: password || "Admin123!",
        email_confirm: true,
        user_metadata: { full_name: "Admin" }
      });

      if (authError) {
        // If user exists, just make them admin
        if (authError.message.includes("already been registered")) {
          await supabase.rpc("make_user_admin", { user_email: email || "admin@luxejewelry.vn" });
          return new Response(JSON.stringify({ success: true, message: "User promoted to admin" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        throw authError;
      }

      // Make the user admin
      if (authData.user) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .upsert({ user_id: authData.user.id, role: "admin" }, { onConflict: "user_id,role" });
        
        if (roleError) console.error("Role error:", roleError);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Admin created successfully",
        email: email || "admin@luxejewelry.vn"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (action === "seed_products") {
      const products = [
        {
          name: "Nhẫn Kim Cương Solitaire",
          slug: "nhan-kim-cuong-solitaire",
          description: "Nhẫn vàng 18K đính kim cương tự nhiên GIA, thiết kế cổ điển thanh lịch",
          category: "nhan",
          material: "diamond",
          weight: 3.5,
          price: 45000000,
          original_price: 52000000,
          images: ["https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800"],
          stock: 15,
          is_featured: true,
          is_active: true
        },
        {
          name: "Dây Chuyền Ngọc Trai Akoya",
          slug: "day-chuyen-ngoc-trai-akoya",
          description: "Dây chuyền ngọc trai Akoya Nhật Bản cao cấp, độ bóng hoàn hảo",
          category: "day_chuyen",
          material: "pearl",
          weight: 25.0,
          price: 28000000,
          original_price: null,
          images: ["https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800"],
          stock: 8,
          is_featured: true,
          is_active: true
        },
        {
          name: "Vòng Tay Vàng 24K",
          slug: "vong-tay-vang-24k",
          description: "Vòng tay vàng 24K nguyên chất, hoa văn truyền thống tinh xảo",
          category: "vong_tay",
          material: "gold_24k",
          weight: 18.7,
          price: 85000000,
          original_price: 92000000,
          images: ["https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=800"],
          stock: 5,
          is_featured: true,
          is_active: true
        },
        {
          name: "Bông Tai Ruby Hồng",
          slug: "bong-tai-ruby-hong",
          description: "Bông tai vàng 18K đính ruby hồng tự nhiên, thiết kế sang trọng",
          category: "bong_tai",
          material: "gemstone",
          weight: 4.2,
          price: 35000000,
          original_price: 38000000,
          images: ["https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800"],
          stock: 12,
          is_featured: true,
          is_active: true
        },
        {
          name: "Nhẫn Cưới Đôi Classic",
          slug: "nhan-cuoi-doi-classic",
          description: "Bộ nhẫn cưới đôi vàng 18K thiết kế cổ điển, khắc tên miễn phí",
          category: "nhan_cuoi",
          material: "gold_18k",
          weight: 8.5,
          price: 25000000,
          original_price: null,
          images: ["https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800"],
          stock: 20,
          is_featured: true,
          is_active: true
        },
        {
          name: "Lắc Tay Bạc Ý 925",
          slug: "lac-tay-bac-y-925",
          description: "Lắc tay bạc Ý 925 mạ vàng trắng, thiết kế hiện đại trẻ trung",
          category: "lac",
          material: "silver",
          weight: 12.0,
          price: 3500000,
          original_price: 4200000,
          images: ["https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800"],
          stock: 30,
          is_featured: true,
          is_active: true
        },
        {
          name: "Mặt Dây Chuyền Sapphire",
          slug: "mat-day-chuyen-sapphire",
          description: "Mặt dây chuyền vàng trắng 18K đính sapphire xanh biển",
          category: "day_chuyen",
          material: "gemstone",
          weight: 5.8,
          price: 42000000,
          original_price: null,
          images: ["https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800"],
          stock: 7,
          is_featured: true,
          is_active: true
        },
        {
          name: "Nhẫn Vàng 18K Hoa Sen",
          slug: "nhan-vang-18k-hoa-sen",
          description: "Nhẫn vàng 18K thiết kế hoa sen Việt Nam, biểu tượng thanh cao",
          category: "nhan",
          material: "gold_18k",
          weight: 4.2,
          price: 12000000,
          original_price: 14500000,
          images: ["https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800"],
          stock: 25,
          is_featured: false,
          is_active: true
        },
        {
          name: "Charm Bạch Kim Trái Tim",
          slug: "charm-bach-kim-trai-tim",
          description: "Charm bạch kim hình trái tim đính kim cương nhỏ",
          category: "charm",
          material: "platinum",
          weight: 2.1,
          price: 8500000,
          original_price: null,
          images: ["https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=800"],
          stock: 40,
          is_featured: false,
          is_active: true
        },
        {
          name: "Bộ Trang Sức Cưới Hoàng Gia",
          slug: "bo-trang-suc-cuoi-hoang-gia",
          description: "Bộ trang sức cưới đầy đủ: vương miện, dây chuyền, bông tai, vòng tay",
          category: "trang_suc_cuoi",
          material: "gold_24k",
          weight: 85.0,
          price: 350000000,
          original_price: 400000000,
          images: ["https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=800"],
          stock: 3,
          is_featured: true,
          is_active: true
        },
        {
          name: "Nhẫn Emerald Colombia",
          slug: "nhan-emerald-colombia",
          description: "Nhẫn vàng 18K đính Emerald Colombia tự nhiên 2.5 carat",
          category: "nhan",
          material: "gemstone",
          weight: 6.8,
          price: 125000000,
          original_price: null,
          images: ["https://images.unsplash.com/photo-1608042314453-ae338d80c427?w=800"],
          stock: 2,
          is_featured: false,
          is_active: true
        },
        {
          name: "Vòng Cổ Choker Kim Cương",
          slug: "vong-co-choker-kim-cuong",
          description: "Vòng cổ choker vàng trắng 18K đính kim cương dọc viền",
          category: "day_chuyen",
          material: "diamond",
          weight: 32.5,
          price: 180000000,
          original_price: 210000000,
          images: ["https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=800"],
          stock: 1,
          is_featured: false,
          is_active: true
        }
      ];

      const { data, error } = await supabase.from("products").insert(products).select();

      if (error) throw error;

      return new Response(JSON.stringify({ 
        success: true, 
        message: `${data.length} products created`,
        products: data 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
