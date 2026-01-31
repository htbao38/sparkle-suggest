import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Enhanced behavior weights with recency consideration
const BEHAVIOR_WEIGHTS = {
  view: 1,
  add_to_cart: 4,
  wishlist: 3,
  purchase: 6,
};

// Time decay factor - older interactions have less weight
const TIME_DECAY_FACTOR = 0.95; // Decay rate per day
const RECENCY_DAYS = 30; // Consider behaviors within last 30 days

// Content similarity weights
const CONTENT_WEIGHTS = {
  category: 0.4,
  material: 0.3,
  price_range: 0.2,
  is_featured: 0.1,
};

interface Product {
  id: string;
  category: string;
  material: string;
  price: number;
  is_featured: boolean;
  name: string;
  slug: string;
  images: string[];
  original_price?: number;
}

interface Behavior {
  user_id: string;
  product_id: string;
  behavior_type: string;
  created_at: string;
}

/**
 * Verify admin role for a user
 */
async function verifyAdminRole(supabaseAdmin: any, userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle();

  if (error) {
    console.error('Error checking admin role:', error);
    return false;
  }

  return !!data;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Service role client for data access (used after auth validation)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { action, user_id, product_id, limit = 8 } = await req.json();

    // For get_recommendations: Allow authenticated users OR product-only recommendations
    if (action === 'get_recommendations') {
      // Check for authentication header
      const authHeader = req.headers.get('Authorization');
      let authenticatedUserId: string | null = null;

      if (authHeader?.startsWith('Bearer ')) {
        // Validate the JWT token
        const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: authHeader } }
        });
        
        const token = authHeader.replace('Bearer ', '');
        const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
        
        if (!claimsError && claimsData?.claims) {
          authenticatedUserId = claimsData.claims.sub as string;
        }
      }

      // If user_id is provided in request, it must match the authenticated user
      // Exception: If no user_id provided, allow product-based recommendations only
      const effectiveUserId = user_id ? (
        authenticatedUserId === user_id ? user_id : null
      ) : null;

      // If user_id was requested but doesn't match authenticated user, reject
      if (user_id && !effectiveUserId) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized: Cannot request recommendations for other users' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const recommendations = await getHybridRecommendations(supabaseAdmin, effectiveUserId, product_id, limit);
      
      return new Response(
        JSON.stringify({ success: true, recommendations }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For update_recommendations: Require admin authentication
    if (action === 'update_recommendations') {
      const authHeader = req.headers.get('Authorization');
      
      if (!authHeader?.startsWith('Bearer ')) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized: Authentication required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate the JWT token
      const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });
      
      const token = authHeader.replace('Bearer ', '');
      const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
      
      if (claimsError || !claimsData?.claims) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized: Invalid token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const userId = claimsData.claims.sub as string;

      // Verify admin role
      const isAdmin = await verifyAdminRole(supabaseAdmin, userId);
      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: 'Forbidden: Admin access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      await updateRecommendationScores(supabaseAdmin);
      
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

/**
 * Hybrid Recommendation Algorithm
 * Combines multiple strategies:
 * 1. User-based Collaborative Filtering with Time Decay
 * 2. Item-based Collaborative Filtering  
 * 3. Content-based Filtering
 * 4. Trending/Popular Products
 * 5. Personalized Ranking
 */
async function getHybridRecommendations(
  supabase: any,
  userId: string | null,
  currentProductId: string | null,
  limit: number
): Promise<Product[]> {
  const candidateScores: Map<string, { score: number; sources: string[] }> = new Map();
  const excludeIds = new Set<string>();
  
  if (currentProductId) excludeIds.add(currentProductId);

  // Fetch all active products for content-based filtering
  const { data: allProducts } = await supabase
    .from('products')
    .select('id, category, material, price, is_featured, name, slug, images, original_price')
    .eq('is_active', true);

  const productMap = new Map<string, Product>();
  if (allProducts) {
    for (const p of allProducts) {
      productMap.set(p.id, p);
    }
  }

  // Strategy 1: User-based Collaborative Filtering with Time Decay
  if (userId) {
    const userCFScores = await getUserBasedCF(supabase, userId, excludeIds);
    mergeScores(candidateScores, userCFScores, 'user_cf', 0.35);
  }

  // Strategy 2: Item-based Collaborative Filtering (current product context)
  if (currentProductId) {
    const itemCFScores = await getItemBasedCF(supabase, currentProductId, excludeIds);
    mergeScores(candidateScores, itemCFScores, 'item_cf', 0.25);
    
    // Strategy 3: Content-based Filtering
    const currentProduct = productMap.get(currentProductId);
    if (currentProduct && allProducts) {
      const contentScores = getContentBasedScores(currentProduct, allProducts, excludeIds);
      mergeScores(candidateScores, contentScores, 'content', 0.2);
    }
  }

  // Strategy 4: Trending Products (recent popularity)
  const trendingScores = await getTrendingProducts(supabase, excludeIds);
  mergeScores(candidateScores, trendingScores, 'trending', 0.15);

  // Strategy 5: Featured Products Boost
  if (allProducts) {
    const featuredScores = new Map<string, number>();
    for (const p of allProducts) {
      if (p.is_featured && !excludeIds.has(p.id)) {
        featuredScores.set(p.id, 0.3); // Small boost for featured
      }
    }
    mergeScores(candidateScores, featuredScores, 'featured', 0.05);
  }

  // Sort candidates by final score
  const sortedCandidates = [...candidateScores.entries()]
    .filter(([id]) => !excludeIds.has(id))
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, limit);

  // Fetch full product details for top candidates
  const topProductIds = sortedCandidates.map(([id]) => id);
  
  if (topProductIds.length === 0) {
    // Ultimate fallback: random featured/active products
    const { data: fallbackProducts } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .neq('id', currentProductId || '00000000-0000-0000-0000-000000000000')
      .order('is_featured', { ascending: false })
      .limit(limit);
    
    return fallbackProducts || [];
  }

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .in('id', topProductIds)
    .eq('is_active', true);

  // Maintain score order
  const productById = new Map((products || []).map((p: Product) => [p.id, p]));
  return topProductIds
    .map(id => productById.get(id))
    .filter((p): p is Product => p !== undefined);
}

/**
 * User-based Collaborative Filtering with Time Decay
 * Finds similar users and recommends products they liked
 */
async function getUserBasedCF(
  supabase: any,
  userId: string,
  excludeIds: Set<string>
): Promise<Map<string, number>> {
  const scores = new Map<string, number>();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - RECENCY_DAYS);

  // Get current user's recent behaviors
  const { data: userBehaviors } = await supabase
    .from('user_behaviors')
    .select('product_id, behavior_type, created_at')
    .eq('user_id', userId)
    .gte('created_at', cutoffDate.toISOString());

  if (!userBehaviors || userBehaviors.length === 0) return scores;

  // Create weighted user profile
  const userProfile = new Map<string, number>();
  for (const b of userBehaviors) {
    const weight = BEHAVIOR_WEIGHTS[b.behavior_type as keyof typeof BEHAVIOR_WEIGHTS] || 1;
    const timeDecay = calculateTimeDecay(b.created_at);
    const adjustedWeight = weight * timeDecay;
    
    userProfile.set(
      b.product_id,
      (userProfile.get(b.product_id) || 0) + adjustedWeight
    );
    excludeIds.add(b.product_id);
  }

  const userProductIds = [...userProfile.keys()];

  // Find similar users
  const { data: similarUserBehaviors } = await supabase
    .from('user_behaviors')
    .select('user_id, product_id, behavior_type, created_at')
    .in('product_id', userProductIds)
    .neq('user_id', userId)
    .gte('created_at', cutoffDate.toISOString())
    .limit(1000);

  if (!similarUserBehaviors || similarUserBehaviors.length === 0) return scores;

  // Calculate user similarity scores using weighted overlap
  const userSimilarity = new Map<string, number>();
  const otherUserProfiles = new Map<string, Map<string, number>>();

  for (const b of similarUserBehaviors) {
    const weight = BEHAVIOR_WEIGHTS[b.behavior_type as keyof typeof BEHAVIOR_WEIGHTS] || 1;
    const timeDecay = calculateTimeDecay(b.created_at);
    
    if (!otherUserProfiles.has(b.user_id)) {
      otherUserProfiles.set(b.user_id, new Map());
    }
    const profile = otherUserProfiles.get(b.user_id)!;
    profile.set(b.product_id, (profile.get(b.product_id) || 0) + weight * timeDecay);
  }

  // Calculate cosine similarity between users
  for (const [otherUserId, otherProfile] of otherUserProfiles) {
    const similarity = cosineSimilarity(userProfile, otherProfile);
    if (similarity > 0.1) {
      userSimilarity.set(otherUserId, similarity);
    }
  }

  // Get all products from similar users
  const similarUserIds = [...userSimilarity.keys()];
  if (similarUserIds.length === 0) return scores;

  const { data: recommendedBehaviors } = await supabase
    .from('user_behaviors')
    .select('user_id, product_id, behavior_type, created_at')
    .in('user_id', similarUserIds)
    .gte('created_at', cutoffDate.toISOString())
    .limit(2000);

  if (!recommendedBehaviors) return scores;

  // Score products weighted by user similarity and behavior
  for (const b of recommendedBehaviors) {
    if (excludeIds.has(b.product_id)) continue;
    
    const similarity = userSimilarity.get(b.user_id) || 0;
    const weight = BEHAVIOR_WEIGHTS[b.behavior_type as keyof typeof BEHAVIOR_WEIGHTS] || 1;
    const timeDecay = calculateTimeDecay(b.created_at);
    
    const score = similarity * weight * timeDecay;
    scores.set(b.product_id, (scores.get(b.product_id) || 0) + score);
  }

  // Normalize scores
  const maxScore = Math.max(...scores.values(), 1);
  for (const [id, score] of scores) {
    scores.set(id, score / maxScore);
  }

  return scores;
}

/**
 * Item-based Collaborative Filtering
 * Uses pre-computed product similarities
 */
async function getItemBasedCF(
  supabase: any,
  productId: string,
  excludeIds: Set<string>
): Promise<Map<string, number>> {
  const scores = new Map<string, number>();

  // Get stored recommendations
  const { data: storedRecs } = await supabase
    .from('product_recommendations')
    .select('recommended_product_id, score')
    .eq('product_id', productId)
    .order('score', { ascending: false })
    .limit(20);

  if (storedRecs) {
    for (const rec of storedRecs) {
      if (!excludeIds.has(rec.recommended_product_id)) {
        scores.set(rec.recommended_product_id, rec.score);
      }
    }
  }

  // Also look for reverse relationships
  const { data: reverseRecs } = await supabase
    .from('product_recommendations')
    .select('product_id, score')
    .eq('recommended_product_id', productId)
    .order('score', { ascending: false })
    .limit(10);

  if (reverseRecs) {
    for (const rec of reverseRecs) {
      if (!excludeIds.has(rec.product_id)) {
        const existing = scores.get(rec.product_id) || 0;
        scores.set(rec.product_id, Math.max(existing, rec.score * 0.8));
      }
    }
  }

  return scores;
}

/**
 * Content-based Filtering
 * Recommends similar products based on attributes
 */
function getContentBasedScores(
  currentProduct: Product,
  allProducts: Product[],
  excludeIds: Set<string>
): Map<string, number> {
  const scores = new Map<string, number>();
  
  // Calculate price range for current product
  const priceRange = getPriceRange(currentProduct.price);

  for (const product of allProducts) {
    if (excludeIds.has(product.id)) continue;
    
    let score = 0;
    
    // Category match
    if (product.category === currentProduct.category) {
      score += CONTENT_WEIGHTS.category;
    }
    
    // Material match
    if (product.material === currentProduct.material) {
      score += CONTENT_WEIGHTS.material;
    }
    
    // Price range similarity
    const otherPriceRange = getPriceRange(product.price);
    if (otherPriceRange === priceRange) {
      score += CONTENT_WEIGHTS.price_range;
    } else if (Math.abs(otherPriceRange - priceRange) === 1) {
      score += CONTENT_WEIGHTS.price_range * 0.5;
    }
    
    // Featured boost
    if (product.is_featured) {
      score += CONTENT_WEIGHTS.is_featured;
    }
    
    if (score > 0) {
      scores.set(product.id, score);
    }
  }

  return scores;
}

/**
 * Get Trending Products
 * Products with recent high engagement
 */
async function getTrendingProducts(
  supabase: any,
  excludeIds: Set<string>
): Promise<Map<string, number>> {
  const scores = new Map<string, number>();
  
  // Get behaviors from last 7 days for trending
  const trendingCutoff = new Date();
  trendingCutoff.setDate(trendingCutoff.getDate() - 7);

  const { data: recentBehaviors } = await supabase
    .from('user_behaviors')
    .select('product_id, behavior_type, created_at')
    .gte('created_at', trendingCutoff.toISOString())
    .limit(500);

  if (!recentBehaviors) return scores;

  // Count weighted interactions
  const trendingScores = new Map<string, number>();
  for (const b of recentBehaviors) {
    if (excludeIds.has(b.product_id)) continue;
    
    const weight = BEHAVIOR_WEIGHTS[b.behavior_type as keyof typeof BEHAVIOR_WEIGHTS] || 1;
    // More recent = higher weight for trending
    const recencyBoost = calculateTimeDecay(b.created_at, 0.9); // Faster decay for trending
    
    trendingScores.set(
      b.product_id,
      (trendingScores.get(b.product_id) || 0) + weight * recencyBoost
    );
  }

  // Normalize
  const maxScore = Math.max(...trendingScores.values(), 1);
  for (const [id, score] of trendingScores) {
    scores.set(id, score / maxScore);
  }

  return scores;
}

/**
 * Merge candidate scores from different strategies
 */
function mergeScores(
  target: Map<string, { score: number; sources: string[] }>,
  source: Map<string, number>,
  sourceName: string,
  weight: number
): void {
  for (const [id, score] of source) {
    const existing = target.get(id) || { score: 0, sources: [] };
    existing.score += score * weight;
    existing.sources.push(sourceName);
    target.set(id, existing);
  }
}

/**
 * Calculate time decay factor
 */
function calculateTimeDecay(dateStr: string, decayRate = TIME_DECAY_FACTOR): number {
  const date = new Date(dateStr);
  const now = new Date();
  const daysDiff = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
  return Math.pow(decayRate, daysDiff);
}

/**
 * Get price range bucket (0-4)
 */
function getPriceRange(price: number): number {
  if (price < 1000000) return 0;
  if (price < 5000000) return 1;
  if (price < 15000000) return 2;
  if (price < 50000000) return 3;
  return 4;
}

/**
 * Calculate cosine similarity between two user profiles
 */
function cosineSimilarity(
  profile1: Map<string, number>,
  profile2: Map<string, number>
): number {
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (const [key, value] of profile1) {
    norm1 += value * value;
    if (profile2.has(key)) {
      dotProduct += value * profile2.get(key)!;
    }
  }

  for (const [, value] of profile2) {
    norm2 += value * value;
  }

  if (norm1 === 0 || norm2 === 0) return 0;
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

/**
 * Update pre-computed recommendation scores
 * Uses improved item-item similarity with behavior weights
 */
async function updateRecommendationScores(supabase: any) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90); // 90 days of data

  const { data: behaviors } = await supabase
    .from('user_behaviors')
    .select('user_id, product_id, behavior_type, created_at')
    .gte('created_at', cutoffDate.toISOString())
    .not('user_id', 'is', null)
    .limit(20000);

  if (!behaviors || behaviors.length === 0) return;

  // Build weighted product-user matrix
  const productUsers = new Map<string, Map<string, number>>();

  for (const b of behaviors) {
    if (!b.user_id) continue;

    const weight = BEHAVIOR_WEIGHTS[b.behavior_type as keyof typeof BEHAVIOR_WEIGHTS] || 1;
    const timeDecay = calculateTimeDecay(b.created_at);

    if (!productUsers.has(b.product_id)) {
      productUsers.set(b.product_id, new Map());
    }
    const users = productUsers.get(b.product_id)!;
    users.set(b.user_id, (users.get(b.user_id) || 0) + weight * timeDecay);
  }

  const products = [...productUsers.keys()];
  const recommendations: Array<{
    product_id: string;
    recommended_product_id: string;
    score: number;
    recommendation_type: string;
  }> = [];

  // Calculate item-item similarity using adjusted cosine
  for (let i = 0; i < products.length; i++) {
    const productA = products[i];
    const usersA = productUsers.get(productA)!;

    for (let j = i + 1; j < products.length; j++) {
      const productB = products[j];
      const usersB = productUsers.get(productB)!;

      const similarity = cosineSimilarity(usersA, usersB);

      if (similarity > 0.05) {
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

  // Add content-based recommendations
  const { data: allProducts } = await supabase
    .from('products')
    .select('id, category, material, price')
    .eq('is_active', true);

  if (allProducts && allProducts.length > 0) {
    for (let i = 0; i < allProducts.length; i++) {
      for (let j = i + 1; j < allProducts.length; j++) {
        const pA = allProducts[i];
        const pB = allProducts[j];
        
        let contentScore = 0;
        if (pA.category === pB.category) contentScore += 0.4;
        if (pA.material === pB.material) contentScore += 0.3;
        if (getPriceRange(pA.price) === getPriceRange(pB.price)) contentScore += 0.2;

        if (contentScore > 0.3) {
          recommendations.push(
            {
              product_id: pA.id,
              recommended_product_id: pB.id,
              score: contentScore,
              recommendation_type: 'content',
            },
            {
              product_id: pB.id,
              recommended_product_id: pA.id,
              score: contentScore,
              recommendation_type: 'content',
            }
          );
        }
      }
    }
  }

  if (recommendations.length > 0) {
    // Clear old recommendations
    await supabase.from('product_recommendations').delete().neq('id', '');

    // Insert new recommendations in batches
    const batchSize = 100;
    for (let i = 0; i < recommendations.length; i += batchSize) {
      const batch = recommendations.slice(i, i + batchSize);
      await supabase.from('product_recommendations').insert(batch);
    }
  }

  console.log(`Updated ${recommendations.length} recommendation pairs`);
}
