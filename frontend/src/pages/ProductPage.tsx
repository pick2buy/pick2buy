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
  MapPin, 
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
import { ProductCard } from '../components/common/ProductCard';
import { StickyMobileBuyBar } from '../components/storefront/StickyMobileBuyBar';

export const ProductPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addItem, isLoading: isCartLoading } = useCartStore();
  const { toggleWishlist, isWishlisted } = useWishlistStore();
  const { user } = useAuthStore();

  const [product, setProduct] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // Pincode state
  const [pincode, setPincode] = useState('560001');
  const [pincodeResult, setPincodeResult] = useState<any>(null);
  const [pincodeChecking, setPincodeChecking] = useState(false);

  // Review submission state
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');

  useEffect(() => {
    if (!slug) return;
    setIsLoading(true);
    api.getProduct(slug)
      .then((res) => {
        setProduct(res.data);
        if (res.data?.images?.length) {
          setSelectedImage(res.data.images[0].url);
        }
        if (res.data?.variants?.length) {
          setSelectedVariant(res.data.variants[0]);
        }
      })
      .catch((err) => {
        console.error('Failed to load product:', err);
      })
      .finally(() => setIsLoading(false));
  }, [slug]);

  const handleCheckPincode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincode || pincode.length !== 6) {
      alert('Please enter a valid 6-digit PIN code');
      return;
    }
    setPincodeChecking(true);
    try {
      const res = await api.checkPincode(pincode);
      setPincodeResult(res.data);
    } catch (err: any) {
      alert(err.message || 'Pincode check failed');
    } finally {
      setPincodeChecking(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    setIsAdding(true);
    try {
      await addItem(product.id, selectedVariant?.id, quantity);
    } catch (err: any) {
      alert(err.message || 'Error adding to cart');
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    setIsAdding(true);
    try {
      await addItem(product.id, selectedVariant?.id, quantity);
      navigate('/checkout');
    } catch (err: any) {
      alert(err.message || 'Error proceeding to checkout');
    } finally {
      setIsAdding(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Please sign in to write a product review');
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
      setReviewMessage('Thank you! Your verified review has been posted.');
      setNewComment('');
      setNewTitle('');
      // Reload product data to show new review
      const res = await api.getProduct(product.slug);
      setProduct(res.data);
    } catch (err: any) {
      alert(err.message || 'Failed to submit review');
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
  const discount = Math.round(((currentMrp - currentPrice) / currentMrp) * 100);
  const wishlisted = isWishlisted(product.id);
  const reviews = product.reviews || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-12">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
        {/* Left: Image Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square rounded-3xl overflow-hidden bg-slate-50 border border-slate-100 shadow-sm group">
            <img
              src={selectedImage || product.images?.[0]?.url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'}
              alt={product.name}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            />
            {discount > 0 && (
              <span className="absolute top-4 left-4 bg-brand-accent text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                Save {discount}%
              </span>
            )}
            <button
              onClick={() => toggleWishlist(product.id)}
              className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                wishlisted
                  ? 'bg-rose-50 text-rose-500 shadow-md'
                  : 'bg-white/90 backdrop-blur-sm text-slate-600 hover:text-rose-500 shadow-md'
              }`}
            >
              <Heart className={`w-5 h-5 ${wishlisted ? 'fill-rose-500' : ''}`} />
            </button>
          </div>

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {product.images.map((img: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img.url)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 flex-shrink-0 transition-all ${
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

        {/* Right: Buy Controls & Specs */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-bold uppercase tracking-wider text-brand-primary">
                {product.brand?.name || 'Pick2Buy Exclusive'}
              </span>
              <span className="font-mono">SKU: {selectedVariant?.sku || product.sku}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {product.name}
            </h1>

            {/* Ratings Summary */}
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1 bg-amber-50 text-amber-800 px-2.5 py-1 rounded-lg text-xs font-bold border border-amber-200/50">
                <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
                <span>{reviews.length ? (reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length).toFixed(1) : "New"}</span>
              </div>
              <span className="text-xs text-slate-500">
                Based on <strong>{reviews.length}</strong> customer reviews
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% Genuine
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
          {product.variants && product.variants.length > 1 && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Select Option: <span className="text-brand-primary">{selectedVariant?.name}</span>
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
                    {v.name}
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
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 font-bold"
                >
                  -
                </button>
                <span className="px-4 text-xs font-bold text-slate-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 font-bold"
                >
                  +
                </button>
              </div>

              {product.stock > 0 ? (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> In Stock & Ready to Ship
                </span>
              ) : (
                <span className="text-xs font-bold text-rose-500">Currently Out of Stock</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleAddToCart}
                disabled={product.stock <= 0 || isAdding}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Bag</span>
              </button>

              <button
                onClick={handleBuyNow}
                disabled={product.stock <= 0 || isAdding}
                className="bg-brand-primary hover:bg-brand-hover text-white font-bold text-xs sm:text-sm py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all hover:scale-[1.02] disabled:opacity-50"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>Buy Now</span>
              </button>
            </div>
          </div>

          {/* Delivery & Pincode Checker */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <MapPin className="w-4 h-4 text-brand-primary" />
              <span>Check Delivery Availability</span>
            </div>

            <form onSubmit={handleCheckPincode} className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 6-digit PIN"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-brand-primary"
              />
              <button
                type="submit"
                disabled={pincodeChecking}
                className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
              >
                {pincodeChecking ? 'Checking...' : 'Check'}
              </button>
            </form>

            {pincodeResult && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  Delivery Available to PIN {pincodeResult.pincode}
                </p>
                <p className="text-[11px] text-emerald-800">
                  Estimated Delivery: <strong>{pincodeResult.estimatedDeliveryDate}</strong>
                </p>
                <p className="text-[11px] text-emerald-800">
                  Cash on Delivery: <strong>Eligible</strong> • Courier: <strong>{pincodeResult.courier}</strong>
                </p>
              </div>
            )}
          </div>

          {/* Guarantees Box */}
          <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl">
              <Truck className="w-4 h-4 text-brand-primary" />
              <span>Free Delivery on ₹499+</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl">
              <RefreshCw className="w-4 h-4 text-emerald-600" />
              <span>7-Day Return Policy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Highlights & Description & Specs Tabs */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 space-y-6 shadow-sm">
        <div>
          <h2 className="text-lg font-black text-slate-900 mb-3">Product Overview & Features</h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
            {product.description}
          </p>
        </div>

        {/* Highlights */}
        {product.highlights && product.highlights.length > 0 && (
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Key Highlights</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {product.highlights.map((h: string, idx: number) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <Sparkles className="w-3.5 h-3.5 text-brand-primary flex-shrink-0" />
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Specifications Table */}
        {product.specifications && Object.keys(product.specifications).length > 0 && (
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Technical Specifications</h3>
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <tbody>
                  {Object.entries(product.specifications).map(([key, val], idx) => (
                    <tr key={key} className={idx % 2 === 0 ? 'bg-slate-50/70' : 'bg-white'}>
                      <td className="px-4 py-2.5 font-bold text-slate-700 w-1/3 border-b border-slate-100">{key}</td>
                      <td className="px-4 py-2.5 text-slate-600 border-b border-slate-100">{String(val)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Customer Reviews & Form */}
      <section className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 space-y-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Customer Reviews & Ratings</h2>
            <p className="text-xs text-slate-500 mt-0.5">Real verified purchase opinions</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-3xl font-black text-slate-900">{reviews.length ? (reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length).toFixed(1) : "New"}</div>
            <div>
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                ))}
              </div>
              <p className="text-[11px] text-slate-400">Verified Buyers</p>
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

      {/* Related Products */}
      {product.relatedProducts && product.relatedProducts.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {product.relatedProducts.map((p: any) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Mobile Sticky Buy Bar */}
      <StickyMobileBuyBar
        product={product}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        isAdding={isAdding}
      />
    </div>
  );
};
