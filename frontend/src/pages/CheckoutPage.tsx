import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Truck, 
  CreditCard, 
  Banknote, 
  QrCode, 
  Lock, 
  ArrowRight, 
  Check, 
  MapPin, 
  User, 
  ChevronRight 
} from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { formatINR } from '../lib/utils';
import { api } from '../services/api';

type RazorpayResult = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void; on: (event: string, callback: (response: any) => void) => void };
  }
}

const loadRazorpay = async () => {
  if (window.Razorpay) return;
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Razorpay checkout could not load. Please check your connection.'));
    document.head.appendChild(script);
  });
  if (!window.Razorpay) throw new Error('Razorpay checkout is unavailable');
};

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, fetchCart } = useCartStore();
  const { user } = useAuthStore();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [onlineAvailable, setOnlineAvailable] = useState(false);
  useEffect(() => { api.getPaymentOptions().then(res => setOnlineAvailable(Boolean(res.data?.onlineAvailable))).catch(() => setOnlineAvailable(false)); }, []);

  // Shipping Address Form
  const [address, setAddress] = useState({
    fullName: user?.name || '',
    mobile: user?.phone || '',
    email: user?.email || '',
    addressLine: '',
    apartment: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: true,
  });

  // Payment Method: COD or RAZORPAY_UPI
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'RAZORPAY_UPI' | 'RAZORPAY_CARD'>('COD');

  const items = cart?.items || [];
  const payableTotal = (cart?.grandTotal || 0) + (paymentMethod === 'COD' ? 49 : 0);
  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4">
        <h2 className="text-xl font-bold text-slate-800">Your cart is empty</h2>
        <p className="text-xs text-slate-500 mt-2 mb-4">Please add items to your cart before proceeding to checkout.</p>
        <Link to="/shop" className="bg-brand-primary text-white text-xs font-bold px-4 py-2 rounded-xl">
          Start Shopping
        </Link>
      </div>
    );
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (address.fullName.trim().length < 2 || !/^[6-9]\d{9}$/.test(address.mobile) || address.addressLine.trim().length < 5 || address.city.trim().length < 2 || address.state.trim().length < 2 || !address.pincode) {
      setErrorMessage('Please fill in all required shipping address fields');
      setCurrentStep(1);
      return;
    }

    if (!/^\d{6}$/.test(address.pincode)) {
      setErrorMessage('Please enter a valid 6-digit PIN code');
      setCurrentStep(1);
      return;
    }

    setIsSubmitting(true);
    let createdOrderNumber = '';
    try {
      if (paymentMethod !== 'COD') await loadRazorpay();
      const payload = {
        shippingAddress: address,
        paymentMethod,
        couponCode: cart?.couponCode || undefined,
      };

      const res = await api.checkout(payload);
      const order = res.data?.order;
      createdOrderNumber = order.orderNumber;
      if (res.data?.orderAccessToken) localStorage.setItem(`pick2buy_order_${order.orderNumber}`, res.data.orderAccessToken);

      if (paymentMethod !== 'COD' && res.data?.paymentOrder) {
        const paymentOrder = res.data.paymentOrder;
        if (!window.Razorpay) throw new Error('Razorpay checkout is unavailable');
        const result = await new Promise<RazorpayResult>((resolve, reject) => {
          const checkout = new window.Razorpay!({
            key: paymentOrder.keyId,
            amount: paymentOrder.amount,
            currency: paymentOrder.currency,
            order_id: paymentOrder.gatewayOrderId,
            name: 'Pick2Buy',
            description: `Order ${order.orderNumber}`,
            prefill: { name: address.fullName, email: address.email, contact: address.mobile },
            theme: { color: '#082c82' },
            handler: (response: RazorpayResult) => resolve(response),
            modal: { ondismiss: () => reject(new Error(`Payment was cancelled. Your order ${order.orderNumber} is pending; contact support to retry.`)) },
          });
          checkout.on('payment.failed', (response: any) => reject(new Error(response.error?.description || 'Payment failed. Please try again.')));
          checkout.open();
        });
        await api.verifyPayment({
          orderNumber: order.orderNumber,
          razorpayOrderId: result.razorpay_order_id,
          razorpayPaymentId: result.razorpay_payment_id,
          razorpaySignature: result.razorpay_signature,
        });
      }

      await fetchCart(); // Refresh cart (will now be empty)
      navigate(`/order-success/${order.orderNumber}`);
    } catch (err: any) {
      setErrorMessage(`${err.message || 'Checkout failed. Please review your details and try again.'}${createdOrderNumber ? ` Order reference: ${createdOrderNumber}.` : ''}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-20">
      {/* Checkout Header & Steps Bar */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Secure Multi-Step Checkout
        </h1>

        <div className="flex items-center gap-3 mt-4 text-xs font-bold">
          <button
            onClick={() => setCurrentStep(1)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
              currentStep === 1
                ? 'bg-brand-primary text-white'
                : 'bg-emerald-50 text-emerald-700'
            }`}
          >
            <span>1. Shipping Address</span>
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <button
            onClick={() => setCurrentStep(2)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
              currentStep === 2
                ? 'bg-brand-primary text-white'
                : currentStep > 2
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            <span>2. Payment Option</span>
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <button
            onClick={() => setCurrentStep(3)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
              currentStep === 3
                ? 'bg-brand-primary text-white'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            <span>3. Review & Place</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl font-semibold">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Form: Step 1 or 2 or 3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* STEP 1: Address */}
          {currentStep === 1 && (
            <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-sm space-y-5">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brand-primary" />
                <h2 className="text-base font-bold text-slate-900">Delivery Address Details</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={address.fullName}
                    onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Mobile Phone (10 digits) *</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={address.mobile}
                    onChange={(e) => setAddress({ ...address, mobile: e.target.value.replace(/\D/g, '') })}
                    placeholder="e.g. 9820112233"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-medium mb-1">Email Address (optional)</label>
                  <input
                    type="email"
                    value={address.email}
                    onChange={(e) => setAddress({ ...address, email: e.target.value })}
                    placeholder="e.g. customer@pick2buy.in"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-medium mb-1">Street Address / House / Flat *</label>
                  <input
                    type="text"
                    required
                    value={address.addressLine}
                    onChange={(e) => setAddress({ ...address, addressLine: e.target.value })}
                    placeholder="Flat 402, Sunshine Heights, 100ft Road"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Landmark (Optional)</label>
                  <input
                    type="text"
                    value={address.landmark}
                    onChange={(e) => setAddress({ ...address, landmark: e.target.value })}
                    placeholder="Near Metro Station"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">6-Digit PIN Code *</label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={address.pincode}
                    onChange={(e) => setAddress({ ...address, pincode: e.target.value.replace(/\D/g, '') })}
                    placeholder="560001"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono outline-none focus:border-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (address.fullName.trim().length < 2 || !/^[6-9]\d{9}$/.test(address.mobile) || address.addressLine.trim().length < 5 || address.city.trim().length < 2 || address.state.trim().length < 2 || !/^\d{6}$/.test(address.pincode)) {
                      setErrorMessage('Please fill in all required shipping address fields');
                      return;
                    }
                    setErrorMessage('');
                    setCurrentStep(2);
                  }}
                  className="bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold px-6 py-3 rounded-2xl flex items-center gap-2 shadow-sm transition-all"
                >
                  <span>Continue to Payment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Payment Options */}
          {currentStep === 2 && (
            <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-sm space-y-5">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-brand-primary" />
                <h2 className="text-base font-bold text-slate-900">Select Payment Method</h2>
              </div>

              <div className="space-y-3">
                {/* Cash on Delivery */}
                <label
                  onClick={() => setPaymentMethod('COD')}
                  className={`flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'COD'
                      ? 'border-brand-primary bg-indigo-50/40'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="payMethod"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    className="mt-1 accent-brand-primary"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Banknote className="w-4 h-4 text-emerald-600" />
                        Cash on Delivery (COD)
                      </span>
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        Recommended
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Pay via Cash or UPI QR to the courier delivery agent when package arrives at your door.
                    </p>
                  </div>
                </label>

                {!onlineAvailable && <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-800">Online payment is unavailable until Razorpay keys are configured. Cash on Delivery remains available for eligible orders.</p>}
                {onlineAvailable && <>
                {/* Razorpay UPI */}
                <label
                  onClick={() => setPaymentMethod('RAZORPAY_UPI')}
                  className={`flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'RAZORPAY_UPI'
                      ? 'border-brand-primary bg-indigo-50/40'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="payMethod"
                    checked={paymentMethod === 'RAZORPAY_UPI'}
                    onChange={() => setPaymentMethod('RAZORPAY_UPI')}
                    className="mt-1 accent-brand-primary"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                        <QrCode className="w-4 h-4 text-indigo-600" />
                        Instant UPI Payment (GPay, PhonePe, Paytm, BHIM)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Fast 0% fee instant payment directly from your bank UPI account.
                    </p>
                  </div>
                </label>

                {/* Cards / Net Banking */}
                <label
                  onClick={() => setPaymentMethod('RAZORPAY_CARD')}
                  className={`flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'RAZORPAY_CARD'
                      ? 'border-brand-primary bg-indigo-50/40'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="payMethod"
                    checked={paymentMethod === 'RAZORPAY_CARD'}
                    onChange={() => setPaymentMethod('RAZORPAY_CARD')}
                    className="mt-1 accent-brand-primary"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-slate-700" />
                        Credit / Debit Card / NetBanking
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Supports RuPay, Visa, Mastercard, and all Indian public & private banks.
                    </p>
                  </div>
                </label>
                </>}
              </div>

              <div className="pt-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-xs font-bold text-slate-600 hover:underline"
                >
                  Back to Address
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold px-6 py-3 rounded-2xl flex items-center gap-2 shadow-sm transition-all"
                >
                  <span>Review Order</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Review & Final Submit */}
          {currentStep === 3 && (
            <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-sm space-y-6">
              <h2 className="text-base font-bold text-slate-900">Review Your Order & Place</h2>

              {/* Delivery snapshot */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1">
                <div className="flex justify-between items-center mb-1">
                  <strong className="text-slate-900 font-bold uppercase tracking-wider">Shipping To:</strong>
                  <button onClick={() => setCurrentStep(1)} className="text-brand-primary font-bold hover:underline">
                    Edit
                  </button>
                </div>
                <p className="text-slate-800 font-semibold">{address.fullName} ({address.mobile})</p>
                <p className="text-slate-600">{address.addressLine}, {address.city}, {address.state} - {address.pincode}</p>
                <p className="text-slate-500">Method: <strong>{paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment'}</strong></p>
              </div>

              {/* Items in order */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Items in Order ({items.length})</h3>
                <div className="divide-y divide-slate-100">
                  {items.map((i: any) => (
                    <div key={i.id} className="py-2.5 flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-800 line-clamp-1 flex-1 mr-4">
                        {i.product.name} × {i.quantity}
                      </span>
                      <strong className="font-bold text-slate-900">{formatINR(i.totalPrice)}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-between items-center border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="text-xs font-bold text-slate-600 hover:underline"
                >
                  Back to Payment
                </button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting}
                  className="bg-brand-primary hover:bg-brand-hover text-white text-xs sm:text-sm font-bold px-8 py-4 rounded-2xl flex items-center gap-2 shadow-lg shadow-brand-primary/20 transition-all hover:scale-[1.02] disabled:opacity-50"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isSubmitting ? 'Placing Order...' : `Confirm & Place Order (${formatINR(payableTotal)})`}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Summary Column */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Order Summary</h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal</span>
                <span className="font-semibold text-slate-900">{formatINR(cart?.subtotal || 0)}</span>
              </div>
              {cart?.couponDiscount ? (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Coupon ({cart.couponCode})</span>
                  <span>-{formatINR(cart.couponDiscount)}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-slate-600">
                <span>Shipping Fee</span>
                <span className="font-semibold">
                  {cart?.shipping === 0 ? <strong className="text-emerald-600">FREE</strong> : formatINR(cart?.shipping || 0)}
                </span>
              </div>
              {paymentMethod === 'COD' && <div className="flex justify-between text-slate-600"><span>Cash on Delivery fee</span><span>{formatINR(49)}</span></div>}
              <div className="flex justify-between text-slate-600">
                <span>Taxes & GST (18%)</span>
                <span>Included</span>
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline text-sm font-black text-slate-900">
                <span>Total Payable</span>
                <span className="text-xl text-brand-primary">{formatINR(payableTotal)}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Pick2Buy Trust Commitment</span>
              </div>
              <p>Review your shipping details and total before placing the order.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
