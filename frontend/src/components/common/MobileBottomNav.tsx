import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Grid, Heart, ShoppingBag, User } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import { useWishlistStore } from '../../store/useWishlistStore';

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const { cart } = useCartStore();
  const { items: wishlist } = useWishlistStore();

  const totalCartCount = cart?.items.reduce((sum, i) => sum + i.quantity, 0) || 0;

  const navItems = [
    { label: 'Home', icon: Home, path: '/' },
    { label: 'Shop', icon: Grid, path: '/shop' },
    { label: 'Wishlist', icon: Heart, path: '/wishlist', badge: wishlist.length },
    { label: 'Cart', icon: ShoppingBag, path: '/cart', badge: totalCartCount },
    { label: 'Account', icon: User, path: '/account' },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-2 px-3 safe-bottom">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                isActive ? 'text-brand-primary font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-4 h-4 rounded-full bg-brand-primary text-white text-[9px] font-bold flex items-center justify-center px-1">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
