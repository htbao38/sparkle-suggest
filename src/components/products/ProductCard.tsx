import { Link } from 'react-router-dom';
import { ShoppingBag, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/constants';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  images: string[];
  isNew?: boolean;
}

export function ProductCard({
  id,
  name,
  slug,
  price,
  originalPrice,
  images,
  isNew,
}: ProductCardProps) {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const discount = originalPrice ? Math.round((1 - price / originalPrice) * 100) : 0;
  const inWishlist = isInWishlist(id);

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inWishlist) {
      removeFromWishlist(id);
    } else {
      addToWishlist(id);
    }
  };

  return (
    <div className="group card-elegant">
      {/* Image container */}
      <div className="relative img-zoom aspect-square bg-secondary/30">
        <Link to={`/san-pham/${slug}`}>
          <img
            src={images[0] || '/placeholder.svg'}
            alt={name}
            className="w-full h-full object-cover"
          />
        </Link>
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {isNew && <span className="badge-new">Mới</span>}
          {discount > 0 && <span className="badge-sale">-{discount}%</span>}
        </div>

        {/* Quick actions */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <Button
            variant="secondary"
            size="icon"
            onClick={handleWishlistToggle}
            className={cn(
              "h-9 w-9 rounded-full shadow-soft transition-all",
              inWishlist ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""
            )}
          >
            <Heart className={cn("h-4 w-4", inWishlist && "fill-current")} />
          </Button>
        </div>

        {/* Add to cart overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button
            onClick={() => addToCart(id)}
            className="w-full btn-gold"
          >
            <ShoppingBag className="h-4 w-4 mr-2" />
            Thêm vào giỏ
          </Button>
        </div>
      </div>

      {/* Product info */}
      <div className="p-4">
        <Link to={`/san-pham/${slug}`}>
          <h3 className="font-display text-lg font-semibold text-foreground hover:text-primary transition-colors line-clamp-2 min-h-[3.5rem]">
            {name}
          </h3>
        </Link>
        <div className="mt-2 flex items-center gap-2">
          <span className="font-body font-semibold text-primary text-lg">
            {formatPrice(price)}
          </span>
          {originalPrice && (
            <span className="text-muted-foreground text-sm line-through">
              {formatPrice(originalPrice)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
