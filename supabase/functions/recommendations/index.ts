import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserBehavior {
  user_id: string;
  product_id: string;
  behavior_type: string;
  weight: number;
}

interface ProductScore {
  product_id: string;
  score: number;
}

// Behavior weights for collaborative filtering
const BEHAVIOR_WEIGHTS = {
  view: 1,
  add_to_cart: 3,
  purchase: 5,
  wishlist: 2,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, user_id, product_id, limit = 8 } = await req.json();

    if (action === 'get_recommendations') {
      // Get personalized recommendations for a user
      const recommendations = await getPersonalizedRecommendations(supabase, user_id, product_id, limit);
      
      return new Response(
        JSON.stringify({ success: true, recommendations }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'update_recommendations') {
      // Update product recommendations using collaborative filtering
      await updateCollaborativeRecommendations(supabase);
      
      return new Response(
        JSON.stringify({ success: true, message: 'Recommendations updated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function getPersonalizedRecommendations(
  supabase: any,
  userId: string | null,
  currentProductId: string | null,
  limit: number
): Promise<any[]> {
  let recommendedProductIds: string[] = [];

  // Strategy 1: User-based collaborative filtering (if user is logged in)
  if (userId) {
    // Get products the user has interacted with
    const { data: userBehaviors } = await supabase
      .from('user_behaviors')
      .select('product_id, behavior_type')
      .eq('user_id', userId);

    if (userBehaviors && userBehaviors.length > 0) {
      const userProductIds = [...new Set(userBehaviors.map((b: any) => b.product_id))];

      // Find similar users (users who interacted with the same products)
      const { data: similarUserBehaviors } = await supabase
        .from('user_behaviors')
        .select('user_id, product_id, behavior_type')
        .in('product_id', userProductIds)
        .neq('user_id', userId)
        .limit(500);

      if (similarUserBehaviors && similarUserBehaviors.length > 0) {
        // Calculate similarity scores for each similar user
        const userSimilarity: Record<string, number> = {};
        const userProducts: Record<string, Set<string>> = {};

        for (const behavior of similarUserBehaviors) {
          const weight = BEHAVIOR_WEIGHTS[behavior.behavior_type as keyof typeof BEHAVIOR_WEIGHTS] || 1;
          userSimilarity[behavior.user_id] = (userSimilarity[behavior.user_id] || 0) + weight;
          
          if (!userProducts[behavior.user_id]) {
            userProducts[behavior.user_id] = new Set();
          }
          userProducts[behavior.user_id].add(behavior.product_id);
        }

        // Get products from similar users that the current user hasn't interacted with
        const productScores: Record<string, number> = {};
        const userProductSet = new Set(userProductIds);

        for (const [otherUserId, similarity] of Object.entries(userSimilarity)) {
          const products = userProducts[otherUserId];
          for (const productId of products) {
            if (!userProductSet.has(productId)) {
              productScores[productId] = (productScores[productId] || 0) + similarity;
            }
          }
        }

        // Sort by score and get top products
        recommendedProductIds = Object.entries(productScores)
          .sort((a, b) => b[1] - a[1])
          .slice(0, limit * 2)
          .map(([productId]) => productId);
      }
    }
  }

  // Strategy 2: Item-based collaborative filtering (if viewing a product)
  if (currentProductId && recommendedProductIds.length < limit) {
    // Get pre-computed recommendations from product_recommendations table
    const { data: storedRecommendations } = await supabase
      .from('product_recommendations')
      .select('recommended_product_id, score')
      .eq('product_id', currentProductId)
      .order('score', { ascending: false })
      .limit(limit);

    if (storedRecommendations) {
      const existingIds = new Set(recommendedProductIds);
      for (const rec of storedRecommendations) {
        if (!existingIds.has(rec.recommended_product_id)) {
          recommendedProductIds.push(rec.recommended_product_id);
        }
      }
    }

    // Fallback: Get products from the same category
    if (recommendedProductIds.length < limit) {
      const { data: currentProduct } = await supabase
        .from('products')
        .select('category, material')
        .eq('id', currentProductId)
        .single();

      if (currentProduct) {
        const { data: similarProducts } = await supabase
          .from('products')
          .select('id')
          .eq('is_active', true)
          .neq('id', currentProductId)
          .or(`category.eq.${currentProduct.category},material.eq.${currentProduct.material}`)
          .limit(limit);

        if (similarProducts) {
          const existingIds = new Set(recommendedProductIds);
          for (const p of similarProducts) {
            if (!existingIds.has(p.id) && recommendedProductIds.length < limit) {
              recommendedProductIds.push(p.id);
            }
          }
        }
      }
    }
  }

  // Strategy 3: Popular products fallback
  if (recommendedProductIds.length < limit) {
    const { data: popularProducts } = await supabase
      .from('user_behaviors')
      .select('product_id')
      .limit(200);

    if (popularProducts) {
      // Count product interactions
      const productCounts: Record<string, number> = {};
      for (const behavior of popularProducts) {
        productCounts[behavior.product_id] = (productCounts[behavior.product_id] || 0) + 1;
      }

      const existingIds = new Set(recommendedProductIds);
      if (currentProductId) existingIds.add(currentProductId);

      const sortedProducts = Object.entries(productCounts)
        .filter(([id]) => !existingIds.has(id))
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit - recommendedProductIds.length)
        .map(([id]) => id);

      recommendedProductIds.push(...sortedProducts);
    }
  }

  // Strategy 4: Featured products as final fallback
  if (recommendedProductIds.length < limit) {
    const existingIds = new Set(recommendedProductIds);
    if (currentProductId) existingIds.add(currentProductId);

    const { data: featuredProducts } = await supabase
      .from('products')
      .select('id')
      .eq('is_active', true)
      .eq('is_featured', true)
      .not('id', 'in', `(${[...existingIds].join(',') || '00000000-0000-0000-0000-000000000000'})`)
      .limit(limit - recommendedProductIds.length);

    if (featuredProducts) {
      recommendedProductIds.push(...featuredProducts.map((p: { id: string }) => p.id));
    }
  }

  // Fetch full product details
  if (recommendedProductIds.length === 0) {
    return [];
  }

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .in('id', recommendedProductIds.slice(0, limit))
    .eq('is_active', true);

  return products || [];
}

async function updateCollaborativeRecommendations(supabase: any) {
  // Get all user behaviors
  const { data: behaviors } = await supabase
    .from('user_behaviors')
    .select('user_id, product_id, behavior_type')
    .limit(10000);

  if (!behaviors || behaviors.length === 0) return;

  // Build user-product interaction matrix
  const userProductMatrix: Record<string, Record<string, number>> = {};
  const productUsers: Record<string, Set<string>> = {};

  for (const behavior of behaviors) {
    if (!behavior.user_id) continue;
    
    const weight = BEHAVIOR_WEIGHTS[behavior.behavior_type as keyof typeof BEHAVIOR_WEIGHTS] || 1;
    
    if (!userProductMatrix[behavior.user_id]) {
      userProductMatrix[behavior.user_id] = {};
    }
    userProductMatrix[behavior.user_id][behavior.product_id] = 
      (userProductMatrix[behavior.user_id][behavior.product_id] || 0) + weight;

    if (!productUsers[behavior.product_id]) {
      productUsers[behavior.product_id] = new Set();
    }
    productUsers[behavior.product_id].add(behavior.user_id);
  }

  // Calculate item-item similarity using cosine similarity
  const products = Object.keys(productUsers);
  const recommendations: Array<{
    product_id: string;
    recommended_product_id: string;
    score: number;
    recommendation_type: string;
  }> = [];

  for (let i = 0; i < products.length; i++) {
    const productA = products[i];
    const usersA = productUsers[productA];

    for (let j = i + 1; j < products.length; j++) {
      const productB = products[j];
      const usersB = productUsers[productB];

      // Calculate Jaccard similarity
      const intersection = [...usersA].filter(u => usersB.has(u)).length;
      const union = new Set([...usersA, ...usersB]).size;
      const similarity = intersection / union;

      if (similarity > 0.1) {
        recommendations.push(
          {
            product_id: productA,
            recommended_product_id: productB,
            score: similarity,
            recommendation_type: 'collaborative',
          },
          {
            product_id: productB,
            recommended_product_id: productA,
            score: similarity,
            recommendation_type: 'collaborative',
          }
        );
      }
    }
  }

  if (recommendations.length > 0) {
    // Clear old collaborative recommendations
    await supabase
      .from('product_recommendations')
      .delete()
      .eq('recommendation_type', 'collaborative');

    // Insert new recommendations in batches
    const batchSize = 100;
    for (let i = 0; i < recommendations.length; i += batchSize) {
      const batch = recommendations.slice(i, i + batchSize);
      await supabase.from('product_recommendations').insert(batch);
    }
  }
}
