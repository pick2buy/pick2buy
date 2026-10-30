import React, { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';

// Resume the explicit Buy Now action after either sign-in or registration.
export const BuyNowPage: React.FC = () => {
  const { user, hasCheckedAuth } = useAuthStore();
  const navigate = useNavigate();
  const started = useRef(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!hasCheckedAuth || !user || started.current) return;
    started.current = true;
    const resume = async () => {
      try {
        const saved = sessionStorage.getItem('pick2buy_pending_buy_now');
        if (!saved) throw new Error('No pending purchase. Please select Buy Now on a product.');
        const intent = JSON.parse(saved);
        if (typeof intent.productId !== 'string' || !intent.productId ||
            (intent.variantId !== null && typeof intent.variantId !== 'string') ||
            !Number.isInteger(intent.quantity) || intent.quantity < 1 || intent.quantity > 99) {
          throw new Error('Please select the product and quantity again.');
        }
        // Consume before sending so a refresh cannot submit this action twice.
        sessionStorage.removeItem('pick2buy_pending_buy_now');
        await useCartStore.getState().addItem(intent.productId, intent.variantId, intent.quantity);
        useCartStore.getState().setCartDrawerOpen(false);
        navigate('/checkout', { replace: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not prepare checkout. Please try again from the product page.');
      }
    };
    void resume();
  }, [hasCheckedAuth, user, navigate]);

  if (hasCheckedAuth && !user) return <Navigate to="/login?redirect=%2Fbuy-now" replace />;
  return (
    <div className="mx-auto max-w-md p-6 text-center">
      {error ? <>
        <p role="alert" className="text-sm text-rose-700">{error}</p>
        <Link to="/shop" className="mt-4 inline-block font-semibold text-brand-primary">Return to shop</Link>
      </> : <p role="status">Preparing your checkout…</p>}
    </div>
  );
};
