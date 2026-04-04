import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface LiveSearchProps {
  className?: string;
  inputClassName?: string;
  placeholder?: string;
  onNavigate?: () => void;
}

export function LiveSearchDropdown({ className = '', inputClassName = '', placeholder = 'Tìm kiếm...', onNavigate }: LiveSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce search input - 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data: results, isLoading } = useQuery({
    queryKey: ['live-search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];
      const { data, error } = await supabase
        .from('products')
        .select('id, name, slug, price, images, category')
        .eq('is_active', true)
        .ilike('name', `%${debouncedQuery}%`)
        .order('is_featured', { ascending: false })
        .limit(6);
      if (error) throw error;
      return data ?? [];
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 30_000,
  });

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN').format(price) + 'đ';

  const handleSelect = () => {
    setQuery('');
    setIsOpen(false);
    onNavigate?.();
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Input
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => { if (query.trim().length >= 2) setIsOpen(true); }}
          className={inputClassName}
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>

      {isOpen && debouncedQuery.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-[60] max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : results && results.length > 0 ? (
            <>
              {results.map((product) => (
                <Link
                  key={product.id}
                  to={`/san-pham/${product.slug}`}
                  onClick={handleSelect}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-md overflow-hidden bg-secondary flex-shrink-0">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                        N/A
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    <p className="text-sm text-primary font-semibold">{formatPrice(Number(product.price))}</p>
                  </div>
                </Link>
              ))}
              <Link
                to={`/san-pham?q=${encodeURIComponent(debouncedQuery)}`}
                onClick={handleSelect}
                className="block text-center py-3 text-sm text-primary hover:bg-secondary/50 border-t border-border font-medium"
              >
                Xem tất cả kết quả
              </Link>
            </>
          ) : (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Không tìm thấy sản phẩm nào
            </div>
          )}
        </div>
      )}
    </div>
  );
}
