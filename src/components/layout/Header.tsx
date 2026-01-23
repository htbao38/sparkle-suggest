import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, User, Menu, X, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { CATEGORIES } from '@/lib/constants';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, isAdmin, signOut } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/san-pham?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      {/* Top bar */}
      <div className="bg-primary text-primary-foreground text-center py-2 text-sm font-body">
        <p>Miễn phí giao hàng cho đơn từ 2.000.000₫ | Hotline: 1800 54 54 57</p>
      </div>

      {/* Main header */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-gold-gradient">
              LUXE JEWELRY
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {Object.entries(CATEGORIES).slice(0, 6).map(([key, value]) => (
              <Link
                key={key}
                to={`/san-pham?category=${key}`}
                className="link-elegant text-sm font-medium uppercase tracking-wider text-foreground/80 hover:text-primary transition-colors"
              >
                {value.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="hidden md:flex items-center">
              <div className="relative">
                <Input
                  type="search"
                  placeholder="Tìm kiếm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48 lg:w-64 pl-10 bg-secondary/50 border-0 focus-visible:ring-primary"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </form>

            {/* Wishlist */}
            <Button variant="ghost" size="icon" className="hidden md:flex">
              <Heart className="h-5 w-5" />
            </Button>

            {/* Cart */}
            <Link to="/gio-hang">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingBag className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Button>
            </Link>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {user ? (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/tai-khoan">Tài khoản của tôi</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/don-hang">Đơn hàng</Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to="/admin" className="text-primary font-medium">
                            Quản trị Admin
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut}>
                      Đăng xuất
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/dang-nhap">Đăng nhập</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/dang-ky">Đăng ký</Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="lg:hidden border-t border-border bg-background">
          <div className="container py-4">
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Input
                  type="search"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </form>
            <nav className="flex flex-col gap-2">
              {Object.entries(CATEGORIES).map(([key, value]) => (
                <Link
                  key={key}
                  to={`/san-pham?category=${key}`}
                  className="py-2 px-4 rounded-md hover:bg-secondary text-sm font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {value.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
