import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { CartDrawer } from './components/common/CartDrawer';
import { HomePage } from './pages/HomePage';
import { useAuthStore } from './store/useAuthStore';
import { ToastViewport } from './components/common/ToastViewport';

const ShopPage = lazy(() => import('./pages/ShopPage').then(module => ({ default: module.ShopPage })));
const CategoryPage = lazy(() => import('./pages/CategoryPage').then(module => ({ default: module.CategoryPage })));
const ProductPage = lazy(() => import('./pages/ProductPage').then(module => ({ default: module.ProductPage })));
const CartPage = lazy(() => import('./pages/CartPage').then(module => ({ default: module.CartPage })));
const WishlistPage = lazy(() => import('./pages/WishlistPage').then(module => ({ default: module.WishlistPage })));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then(module => ({ default: module.CheckoutPage })));
const BuyNowPage = lazy(() => import('./pages/BuyNowPage').then(module => ({ default: module.BuyNowPage })));
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccessPage').then(module => ({ default: module.OrderSuccessPage })));
const OrderTrackingPage = lazy(() => import('./pages/OrderTrackingPage').then(module => ({ default: module.OrderTrackingPage })));
const ReceiptPage = lazy(() => import('./pages/ReceiptPage').then(module => ({ default: module.ReceiptPage })));
const PaymentFailedPage = lazy(() => import('./pages/PaymentFailedPage').then(module => ({ default: module.PaymentFailedPage })));
const OrderCancelledPage = lazy(() => import('./pages/OrderCancelledPage').then(module => ({ default: module.OrderCancelledPage })));
const AccountPage = lazy(() => import('./pages/AccountPage').then(module => ({ default: module.AccountPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(module => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(module => ({ default: module.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then(module => ({ default: module.ForgotPasswordPage })));
const InfoPage = lazy(() => import('./pages/InfoPage').then(module => ({ default: module.InfoPage })));
const AdminLayout = lazy(() => import('./layouts/AdminLayout').then(module => ({ default: module.AdminLayout })));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage').then(module => ({ default: module.AdminUsersPage })));
const AdminOffersPage = lazy(() => import('./pages/admin/AdminOffersPage').then(module => ({ default: module.AdminOffersPage })));
const AdminSalesPage = lazy(() => import('./pages/admin/AdminSalesPage').then(module => ({ default: module.AdminSalesPage })));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage').then(module => ({ default: module.AdminDashboardPage })));
const AdminOrdersPage = lazy(() => import('./pages/admin/AdminOrdersPage').then(module => ({ default: module.AdminOrdersPage })));
const AdminProductsPage = lazy(() => import('./pages/admin/AdminProductsPage').then(module => ({ default: module.AdminProductsPage })));
const AdminInventoryPage = lazy(() => import('./pages/admin/AdminInventoryPage').then(module => ({ default: module.AdminInventoryPage })));
const AdminCrmPage = lazy(() => import('./pages/admin/AdminCrmPage').then(module => ({ default: module.AdminCrmPage })));
const AdminTicketsPage = lazy(() => import('./pages/admin/AdminTicketsPage').then(module => ({ default: module.AdminTicketsPage })));
const AdminCouponsPage = lazy(() => import('./pages/admin/AdminCouponsPage').then(module => ({ default: module.AdminCouponsPage })));
const AdminAuditPage = lazy(() => import('./pages/admin/AdminAuditPage').then(module => ({ default: module.AdminAuditPage })));
const AdminCatalogPage = lazy(() => import('./pages/admin/AdminCatalogPage').then(module => ({ default: module.AdminCatalogPage })));
const AdminBannersPage = lazy(() => import('./pages/admin/AdminBannersPage').then(module => ({ default: module.AdminBannersPage })));
const AdminReviewsPage = lazy(() => import('./pages/admin/AdminReviewsPage').then(module => ({ default: module.AdminReviewsPage })));

const ScrollToTop = () => {
  const { pathname, search } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [pathname, search]);
  return null;
};

const StorefrontLayout: React.FC = () => {
  const { pathname } = useLocation();
  const isProductPage = pathname.startsWith('/product/');
  return (
    <div className="storefront min-h-screen flex flex-col">
      <Header />
      <CartDrawer />
      <main className={`storefront-main flex-1 ${isProductPage ? 'storefront-main--product' : ''}`}>
        <Outlet />
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export const App: React.FC = () => {
  const { fetchMe } = useAuthStore();

  useEffect(() => {
    fetchMe();
  }, []);

  return (
    <Router>
      <ToastViewport />
      <ScrollToTop />
      <Suspense fallback={<div role="status" className="page-width py-12 text-slate-500">Loading...</div>}>
      <Routes>
        {/* Customer Storefront Routes */}
        <Route element={<StorefrontLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} /><Route path="/search" element={<ShopPage />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/product/:slug" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/buy-now" element={<BuyNowPage />} />
          <Route path="/order-success/:orderNumber" element={<OrderSuccessPage />} />
          <Route path="/payment-failed/:orderNumber" element={<PaymentFailedPage />} />
          <Route path="/order-cancelled/:orderNumber" element={<OrderCancelledPage />} />
          <Route path="/account/orders/:orderNumber" element={<OrderTrackingPage />} />
          <Route path="/account/orders/:orderNumber/receipt" element={<ReceiptPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/about" element={<InfoPage />} />
          <Route path="/privacy-policy" element={<InfoPage />} />
          <Route path="/terms" element={<InfoPage />} />
          <Route path="/shipping-returns" element={<InfoPage />} />
          <Route path="/contact" element={<InfoPage />} />
        </Route>

        {/* Admin Management Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} /><Route path="offers" element={<AdminOffersPage />} /><Route path="reports" element={<AdminSalesPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="catalog" element={<AdminCatalogPage />} />
          <Route path="banners" element={<AdminBannersPage />} />
          <Route path="reviews" element={<AdminReviewsPage />} />
          <Route path="inventory" element={<AdminInventoryPage />} />
          <Route path="crm" element={<AdminCrmPage />} />
          <Route path="tickets" element={<AdminTicketsPage />} />
          <Route path="coupons" element={<AdminCouponsPage />} />
          <Route path="audit" element={<AdminAuditPage />} />
        </Route>
      </Routes>
      </Suspense>
    </Router>
  );
};

export default App;
