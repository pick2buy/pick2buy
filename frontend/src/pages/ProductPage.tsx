import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Star, 
  Heart, 
  ShoppingBag, 
  Zap, 
  Truck, 
  RefreshCw, 
  ShieldCheck, 
  Check, 
  CheckCircle2, 
  ChevronRight,
  Share2,
  Clock,
  Sparkles,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { formatINR } from '../lib/utils';
import { useCartStore } from '../store/useCartStore';
import { useWishlistStore } from '../store/useWishlistStore';
import { useAuthStore } from '../store/useAuthStore';
import { StickyMobileBuyBar } from '../components/storefront/StickyMobileBuyBar';
import { ProductImageViewer } from '../components/storefront/ProductImageViewer';
import { ProductOverview } from '../components/storefront/ProductOverview';
import { toast } from '../store/useToastStore';

export const ProductPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addItem, cart, setCartDrawerOpen, updateQuantity } = useCartStore();
  const { toggleWishlist, isWishlisted } = useWishlistStore();
  const { user } = useAuthStore();

  const [product, setProduct] = useState<any>(null);
  const [isTitleExpanded, setIsTitleExpanded] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [wishlistFeedback, setWishlistFeedback] = useState(false);

  // Review submission state
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');

  useEffect(() => {
    if (!slug) return;
    setIsLoading(true);
    setIsTitleExpanded(false);
    setIsImageViewerOpen(false);
    setSelectedVariant(null);
    api.getProduct(slug)
      .then((res) => {
        setProduct(res.data);
        if (res.data?.images?.length) {
          setSelectedImage(res.data.images[0].url);
        }
        // A single variant is not shown as a selectable option, so keep the
        // product-level inventory as the source of truth for it. Variants only
        // drive pricing and availability once the customer can choose one.
        if (res.data?.variants?.length > 1) {
          setSelectedVariant(res.data.variants[0]);
        }
      })
      .catch((err) => {
        console.error('Failed to load product:', err);
      })
      .finally(() => setIsLoading(false));
  }, [slug]);

  const cartItemForSelection = product ? cart?.items.find((item) =>
    item.productId === product.id && (selectedVariant ? item.variantId === selectedVariant.id : !item.variantId),
  ) : undefined;
  const isInBag = Boolean(cartItemForSelection);
  const selectedQuantity = cartItemForSelection?.quantity ?? quantity;

  const changeQuantity = (nextQuantity: number) => {
    const validQuantity = Math.max(1, Math.min(availableStock, nextQuantity));
    setQuantity(validQuantity);
    if (cartItemForSelection) void updateQuantity(cartItemForSelection.id, validQuantity);
  };

  const updateZoomPosition = (event: React.MouseEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    setZoomPosition({
      x: Math.max(0, Math.min(100, ((event.clientX - bounds.left) / bounds.width) * 100)),
      y: Math.max(0, Math.min(100, ((event.clientY - bounds.top) / bounds.height) * 100)),
    });
  };

  const handleAddToCart = async () => {
    if (!product) return;
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`/product/${product.slug}`)}`);
      return;
    }
    if (isInBag) {
      setCartDrawerOpen(true);
      return;
    }
    setIsAdding(true);
    try {
      await addItem(product.id, selectedVariant?.id, quantity);
    } catch (err: any) {
      toast.error(err.message || 'Could not add this item to your bag');
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    if (!user) {
      sessionStorage.setItem('pick2buy_pending_buy_now', JSON.stringify({
        productId: product.id,
        variantId: selectedVariant?.id || null,
        quantity,
      }));
      navigate('/login?redirect=%2Fbuy-now');
      return;
    }
    setIsAdding(true);
    try {
      await addItem(product.id, selectedVariant?.id, quantity);
      setCartDrawerOpen(false);
      navigate('/checkout');
    } catch (err: any) {
      toast.error(err.message || 'Could not proceed to checkout');
    } finally {
      setIsAdding(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (!user) {
      toast.info('Please sign in to save items to your wishlist.');
      return;
    }
    if (!wishlisted) {
      setWishlistFeedback(true);
      setTimeout(() => setWishlistFeedback(false), 650);
    }
    try {
      await toggleWishlist(product.id);
    } catch (err: any) {
      toast.error(err.message || 'Could not update your wishlist.');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.info('Please sign in to write a product review.');
      navigate('/login');
      return;
    }
    if (!newComment.trim()) return;

    setIsSubmittingReview(true);
    try {
      await api.submitReview(product.id, {
        rating: newRating,
        title: newTitle,
        comment: newComment,
      });
      setReviewMessage('Thank you! Your review has been posted.');
      setNewComment('');
      setNewTitle('');
      // Reload product data to show new review
      const res = await api.getProduct(product.slug);
      setProduct(res.data);
    } catch (err: any) {
      toast.error(err.message || 'Could not submit your review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="aspect-square bg-slate-100 rounded-3xl animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 bg-slate-100 rounded-xl w-3/4 animate-pulse" />
            <div className="h-6 bg-slate-100 rounded-xl w-1/4 animate-pulse" />
            <div className="h-24 bg-slate-100 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4">
        <h2 className="text-xl font-bold text-slate-800">Product Not Found</h2>
        <p className="text-xs text-slate-500 mt-2 mb-4">The requested item might be sold out or unavailable.</p>
        <Link to="/shop" className="bg-brand-primary text-white text-xs font-bold px-4 py-2 rounded-xl">
          Return to Store
        </Link>
      </div>
    );
  }

  const currentPrice = selectedVariant ? selectedVariant.price : product.price;
  const currentMrp = selectedVariant ? selectedVariant.mrp : product.mrp;
  const availableStock = selectedVariant ? selectedVariant.stock : product.stock;
  const discount = Math.round(((currentMrp - currentPrice) / currentMrp) * 100);
  const wishlisted = isWishlisted(product.id);
  const reviews = product.reviews || [];
  const averageRating = reviews.length
    ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length
    : 0;
  // Keep the identifying name and size; move appended benefits to See more.
  const fullTitle = String(product.name).trim();
  const mainTitle = fullTitle.split(/\s*\|\s*|\s+(?:removes|suitable for|ideal for)\s+/i)[0].trim();
  const titleWords = mainTitle.split(/\s+/);
  const compactTitle = titleWords.length > 12 ? titleWords.slice(0, 12).join(' ') : mainTitle;
  const hasMoreTitle = compactTitle !== fullTitle;

  return (
    <div className="product-page max-w-7xl mx-auto px-4 sm:px-6 py-4 pb-24 space-y-6 sm:space-y-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link to="/" className="hover:text-slate-800">Home</Link>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <Link to="/shop" className="hover:text-slate-800">Shop</Link>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        {product.category && (
          <>
            <Link to={`/category/${product.category.slug}`} className="hover:text-slate-800">
              {product.category.name}
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
          </>
        )}
        <span className="font-semibold text-slate-900 truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main PDP Grid: Gallery & Purchase Column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
        {/* Left: Image Gallery */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
            <div
              onMouseEnter={() => setIsImageZoomed(window.matchMedia('(hover: hover) and (pointer: fine)').matches)}
              onMouseLeave={() => setIsImageZoomed(false)}
              onMouseMove={updateZoomPosition}
              className={`relative aspect-square lg:order-2 lg:h-[440px] lg:flex-1 lg:aspect-auto xl:h-[470px] rounded-3xl overflow-hidden bg-slate-50 border border-slate-100 shadow-sm ${isImageZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
            >
              <button type="button" aria-label={`Open full-size images of ${product.name}`} onClick={() => { setIsImageZoomed(false); setIsImageViewerOpen(true); }} className="block h-full w-full cursor-zoom-in">
              <img
                src={selectedImage || product.images?.[0]?.url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'}
                alt={product.name}
                className="w-full h-full object-contain object-center p-3 transition-transform duration-200 ease-out"
                style={{
                  transform: isImageZoomed ? 'scale(2.2)' : 'scale(1)',
                  transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                }}
              />
              </button>
              {isImageZoomed && <div
                aria-hidden="true"
                className="pointer-events-none absolute hidden h-24 w-24 rounded-full border-2 border-white/90 bg-white/10 shadow-lg lg:block"
                style={{ left: `${zoomPosition.x}%`, top: `${zoomPosition.y}%`, transform: 'translate(-50%, -50%)' }}
              />}
              {discount > 0 && (
                <span className="absolute top-4 left-4 bg-brand-accent text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                  Save {discount}%
                </span>
              )}
              <button
                onClick={handleWishlistToggle}
                className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  wishlisted
                    ? 'bg-rose-50 text-rose-500 shadow-md'
                    : 'bg-white/90 backdrop-blur-sm text-slate-600 hover:text-rose-500 shadow-md'
                } ${wishlistFeedback ? 'action-wishlist-pop' : ''}`}
                aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
              >
                <Heart className={`w-5 h-5 ${wishlisted ? 'fill-rose-500 action-icon-pop' : ''}`} />
              </button>
            </div>

            {/* Thumbnails stay horizontal on mobile and form a scrollable left rail on desktop. */}
            {product.images && product.images.length > 1 && (
              <div className="flex order-3 gap-3 overflow-x-auto pb-2 lg:order-1 lg:max-h-[470px] lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto lg:pb-0 lg:pr-1">
              {product.images.map((img: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img.url)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                    selectedImage === img.url
                      ? 'border-brand-primary ring-2 ring-brand-primary/20 scale-105'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img src={img.url} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Buy Controls & Specs */}
        <div className="space-y-4 sm:space-y-5">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-bold uppercase tracking-wider text-brand-primary">
                {product.brand?.name || 'Pick2Buy Exclusive'}
              </span>
              <span className="font-mono">SKU: {selectedVariant?.sku || product.sku}</span>
            </div>

            <h1 id="product-title" className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              <span className="sm:hidden">{isTitleExpanded ? fullTitle : compactTitle}</span>
              <span className="hidden sm:inline">{fullTitle}</span>
            </h1>
            {hasMoreTitle && (
              <button
                type="button"
                className="sm:hidden mt-1 text-sm font-semibold text-brand-primary underline underline-offset-2"
                aria-expanded={isTitleExpanded}
                aria-controls="product-title"
                onClick={() => setIsTitleExpanded((expanded) => !expanded)}
              >
                {isTitleExpanded ? 'See less' : 'See more'}
              </button>
            )}

            {/* Ratings Summary */}
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1 bg-amber-50 text-amber-800 px-2.5 py-1 rounded-lg text-xs font-bold border border-amber-200/50">
                <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
                <span>{reviews.length ? averageRating.toFixed(1) : 'No ratings yet'}</span>
              </div>
              <span className="text-xs text-slate-500">
                Based on <strong>{reviews.length}</strong> customer reviews
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Product details below
              </span>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-slate-900">
                {formatINR(currentPrice)}
              </span>
              {currentMrp > currentPrice && (
                <>
                  <span className="text-base text-slate-400 line-through">
                    {formatINR(currentMrp)}
                  </span>
                  <span className="text-xs font-extrabold text-brand-accent bg-orange-100 px-2.5 py-0.5 rounded-full">
                    {discount}% OFF
                  </span>
                </>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Inclusive of all taxes (GST 18%). Free doorstep delivery across India.
            </p>
          </div>

          {/* Variants Selector */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {product.variants.length === 1 ? 'Available option' : 'Select option'}: <span className="text-brand-primary">{selectedVariant?.name}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v: any) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                      selectedVariant?.id === v.id
                        ? 'border-brand-primary bg-indigo-50/50 text-brand-primary ring-2 ring-brand-primary/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {v.name || [v.color, v.size].filter(Boolean).join(' / ')}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity & CTA Buttons */}
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Quantity:</span>
              <div className="flex items-center border border-slate-200 rounded-xl bg-white overflow-hidden">
                <button
                  onClick={() => changeQuantity(selectedQuantity - 1)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 font-bold"
                >
                  -
                </button>
                <span className="px-4 text-xs font-bold text-slate-900">{selectedQuantity}</span>
                <button
                  onClick={() => changeQuantity(selectedQuantity + 1)}
                  disabled={selectedQuantity >= availableStock}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 font-bold"
                >
                  +
                </button>
              </div>

              {availableStock > 0 ? (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> In Stock & Ready to Ship
                </span>
              ) : (
                <span className="text-xs font-bold text-rose-500">Currently Out of Stock</span>
              )}
            </div>

            {availableStock > 0 && availableStock < 5 && (
              <p className="text-xs font-bold text-amber-700" role="status">
                Hurry — only {availableStock} left in stock.
              </p>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleAddToCart}
                disabled={availableStock <= 0 || isAdding}
                className={`bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 ${isInBag ? 'action-cart-success' : ''}`}
              >
                {isInBag ? <Check className="w-4 h-4 stroke-[3]" /> : <ShoppingBag className="w-4 h-4" />}
                <span>{isInBag ? 'Already in Bag' : 'Add to Bag'}</span>
              </button>

              <button
                onClick={handleBuyNow}
                disabled={availableStock <= 0 || isAdding}
                className="bg-brand-primary hover:bg-brand-hover text-white font-bold text-xs sm:text-sm py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all hover:scale-[1.02] disabled:opacity-50"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>Buy Now</span>
              </button>
            </div>
          </div>

          {/* Guarantees Box */}
          <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl">
              <Truck className="w-4 h-4 text-brand-primary" />
              <span>Free Delivery on ₹499+</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl">
              <RefreshCw className="w-4 h-4 text-emerald-600" />
              <span>Need help? Contact support</span>
            </div>
          </div>

          {/* Product overview stays with the purchase details in the right column. */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6">
            <ProductOverview key={product.id} name={product.name} description={product.description || ''} highlights={product.highlights} specifications={product.specifications} />
          </div>
        </div>
      </div>

      {product.relatedProducts && product.relatedProducts.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">Similar products</h2>
          <div className="grid grid-cols-3 gap-3 sm:max-w-2xl">
            {product.relatedProducts.slice(0, 3).map((p: any) => (
              <Link key={p.id} to={`/product/${p.slug || p.id}`} className="group min-w-0 overflow-hidden rounded-2xl border border-slate-100 bg-white p-2 transition-shadow hover:shadow-md">
                <div className="aspect-square overflow-hidden rounded-xl bg-slate-50">
                  <img src={p.images?.[0]?.url || '/product-placeholder.svg'} alt={p.name} loading="lazy" className="h-full w-full object-contain transition-transform group-hover:scale-105" />
                </div>
                <p className="mt-2 line-clamp-2 text-xs font-semibold text-slate-800">{p.name}</p>
                <p className="mt-1 text-xs font-bold text-slate-900">{formatINR(p.price)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Customer Reviews & Form */}
      <section className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 space-y-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Customer Reviews & Ratings</h2>
            <p className="text-xs text-slate-500 mt-0.5">Customer opinions</p>
          </div>
          <div className="flex items-center gap-2">
            {reviews.length > 0 && <div className="text-3xl font-black text-slate-900">{averageRating.toFixed(1)}</div>}
            <div>
              <div className="flex" role="img" aria-label={reviews.length ? `${averageRating.toFixed(1)} out of 5 stars` : 'No ratings yet'}>
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="relative block h-3.5 w-3.5" aria-hidden="true">
                    <Star className="h-3.5 w-3.5 text-slate-300" />
                    <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${Math.max(0, Math.min(1, averageRating - i)) * 100}%` }}>
                      <Star className="h-3.5 w-3.5 max-w-none fill-amber-400 text-amber-400" />
                    </span>
                  </span>
                ))}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {reviews.length ? `${reviews.length} customer review${reviews.length === 1 ? '' : 's'}` : 'No ratings yet'}
              </p>
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <p className="text-xs text-slate-500 italic">Be the first to review this product!</p>
          ) : (
            reviews.map((r: any) => (
              <div key={r.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{r.user?.name || 'Pick2Buy Customer'}</span>
                    {r.isVerifiedPurchase && (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" /> Verified Purchase
                      </span>
                    )}
                  </div>
                  <div className="flex text-amber-400">
                    {[...Array(r.rating)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400" />
                    ))}
                  </div>
                </div>
                {r.title && <h4 className="text-xs font-bold text-slate-800">{r.title}</h4>}
                <p className="text-xs text-slate-600 leading-relaxed">{r.comment}</p>
                {r.adminReply && (
                  <div className="mt-2 pl-3 border-l-2 border-brand-primary text-[11px] text-indigo-900 bg-indigo-50/60 p-2 rounded-r-lg">
                    <strong>Pick2Buy Response:</strong> {r.adminReply}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Write a Review Section */}
        <div className="pt-6 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Leave a Review</h3>
          {reviewMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-semibold">
              {reviewMessage}
            </div>
          )}
          <form onSubmit={handleSubmitReview} className="space-y-3 max-w-xl">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Your Rating</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setNewRating(star)}
                    className="p-1 text-amber-400 hover:scale-110 transition-transform"
                  >
                    <Star className={`w-5 h-5 ${star <= newRating ? 'fill-amber-400' : 'text-slate-300'}`} />
                  </button>
                ))}
              </div>
            </div>

            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Review title (e.g. Great sound quality!)"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-brand-primary"
            />

            <textarea
              required
              rows={3}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write your honest experience with the product..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-brand-primary"
            />

            <button
              type="submit"
              disabled={isSubmittingReview}
              className="bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>
      </section>

      {/* Mobile Sticky Buy Bar */}
      {isImageViewerOpen && <ProductImageViewer
        images={product.images?.length ? product.images.map((image: { url: string }) => image.url) : [selectedImage || '/product-placeholder.svg']}
        initialImage={selectedImage}
        name={product.name}
        onClose={() => setIsImageViewerOpen(false)}
      />}
      <StickyMobileBuyBar
        product={{ ...product, price: currentPrice, mrp: currentMrp, stock: availableStock }}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        isAdding={isAdding}
        inBag={isInBag}
      />
    </div>
  );
};
