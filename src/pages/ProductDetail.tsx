import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShoppingBag, Heart, Truck, Shield, ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice, MATERIALS, CATEGORIES } from '@/lib/constants';
import { RecommendedProducts } from '@/components/products/RecommendedProducts';
import { toast } from 'sonner';

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  // Track product view behavior
  useEffect(() => {
    if (product && user) {
      supabase.from('user_behaviors').insert({
        user_id: user.id,
        product_id: product.id,
        behavior_type: 'view',
      }).then(() => {});
    }
  }, [product, user]);

  const handleAddToCart = async () => {
    if (!product) return;
    await addToCart(product.id, quantity);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-2 gap-12">
            <Skeleton className="aspect-square rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-8 w-1/4" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="font-display text-2xl font-bold mb-4">Sản phẩm không tồn tại</h1>
          <Link to="/san-pham">
            <Button className="btn-gold">Xem sản phẩm khác</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const images = product.images?.length ? product.images : ['/placeholder.svg'];
  const discount = product.original_price 
    ? Math.round((1 - Number(product.price) / Number(product.original_price)) * 100) 
    : 0;

  return (
    <Layout>
      {/* Breadcrumb */}
      <div className="bg-secondary/30 py-4">
        <div className="container mx-auto px-4">
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-muted-foreground hover:text-primary">Trang chủ</Link>
            <span className="text-muted-foreground">/</span>
            <Link to="/san-pham" className="text-muted-foreground hover:text-primary">Sản phẩm</Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-lg bg-secondary/30">
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {discount > 0 && (
                <span className="absolute top-4 left-4 badge-sale text-base px-3 py-1">
                  -{discount}%
                </span>
              )}
              
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImage(i => i > 0 ? i - 1 : images.length - 1)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setSelectedImage(i => i < images.length - 1 ? i + 1 : 0)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
            
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-colors ${
                      i === selectedImage ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">{product.name}</h1>
              <div className="flex items-center gap-4">
                <span className="text-3xl font-bold text-primary">{formatPrice(Number(product.price))}</span>
                {product.original_price && (
                  <span className="text-xl text-muted-foreground line-through">
                    {formatPrice(Number(product.original_price))}
                  </span>
                )}
              </div>
            </div>

            <p className="text-muted-foreground leading-relaxed">{product.description}</p>

            {/* Product Details */}
            <div className="grid grid-cols-2 gap-4 py-6 border-y border-border">
              <div>
                <span className="text-sm text-muted-foreground">Chất liệu</span>
                <p className="font-medium">{MATERIALS[product.material as keyof typeof MATERIALS]?.label}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Loại sản phẩm</span>
                <p className="font-medium">{CATEGORIES[product.category as keyof typeof CATEGORIES]?.label}</p>
              </div>
              {product.weight && (
                <div>
                  <span className="text-sm text-muted-foreground">Trọng lượng</span>
                  <p className="font-medium">{product.weight}g</p>
                </div>
              )}
              <div>
                <span className="text-sm text-muted-foreground">Tình trạng</span>
                <p className={`font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {product.stock > 0 ? `Còn ${product.stock} sản phẩm` : 'Hết hàng'}
                </p>
              </div>
            </div>

            {/* Quantity & Add to Cart */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center border border-border rounded-md">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="p-3 hover:bg-secondary transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-16 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => Math.min(product.stock || 99, q + 1))}
                  className="p-3 hover:bg-secondary transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              
              <Button
                onClick={handleAddToCart}
                className="flex-1 btn-gold text-base py-6"
                disabled={!product.stock}
              >
                <ShoppingBag className="mr-2 h-5 w-5" />
                Thêm vào giỏ hàng
              </Button>
              
              <Button variant="outline" size="icon" className="h-12 w-12">
                <Heart className="h-5 w-5" />
              </Button>
            </div>

            {/* Features */}
            <div className="flex flex-col gap-3 pt-4">
              <div className="flex items-center gap-3 text-sm">
                <Truck className="h-5 w-5 text-primary" />
                <span>Miễn phí giao hàng cho đơn từ 2.000.000₫</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Shield className="h-5 w-5 text-primary" />
                <span>Bảo hành trọn đời - Đổi trả miễn phí trong 48h</span>
              </div>
            </div>
          </div>
        </div>

        {/* Personalized Recommendations */}
        <div className="mt-20">
          <RecommendedProducts 
            currentProductId={product.id} 
            title="Có thể bạn cũng thích"
            limit={4}
          />
        </div>
      </div>
    </Layout>
  );
}
