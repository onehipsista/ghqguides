import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Eager — public pages that need to be fast on first load
import Index from "./pages/Index.tsx";
import MistakesPage from "./pages/Mistakes.tsx";
import GuidesPage from "./pages/Guides.tsx";
import GuideOverviewPage from "./pages/GuideOverview.tsx";
import SearchPage from "./pages/Search.tsx";
import LoginPage from "./pages/Login.tsx";
import BillingSuccessPage from "./pages/BillingSuccess.tsx";
import BillingCancelPage from "./pages/BillingCancel.tsx";
import ShopPage from "./pages/Shop.tsx";
import ShopProductPage from "./pages/ShopProduct.tsx";
import BlogPage from "./pages/Blog.tsx";
import BlogPostPage from "./pages/BlogPost.tsx";
import NotFound from "./pages/NotFound.tsx";

// Lazy — article page pulls in react-markdown + remark-gfm
const GuideArticlePage = lazy(() => import("./pages/GuideArticle.tsx"));
const BillingCheckoutPage = lazy(() => import("./pages/BillingCheckout.tsx"));

// Lazy — admin pages pull in SimpleMDE/EasyMDE (~900 KB) only when visited
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboard.tsx"));
const AdminMistakesPage = lazy(() => import("./pages/admin/AdminMistakes.tsx"));
const AdminMistakeEditorPage = lazy(() => import("./pages/admin/AdminMistakeEditor.tsx"));
const AdminGuidesPage = lazy(() => import("./pages/admin/AdminGuides.tsx"));
const AdminGuideEditorPage = lazy(() => import("./pages/admin/AdminGuideEditor.tsx"));
const AdminArticleEditorPage = lazy(() => import("./pages/admin/AdminArticleEditor.tsx"));
const AdminCategoriesPage = lazy(() => import("./pages/admin/AdminCategories.tsx"));
const AdminUsersPage = lazy(() => import("./pages/admin/AdminUsers.tsx"));
const AdminProductsPage = lazy(() => import("./pages/admin/AdminProducts.tsx"));
const AdminProductEditorPage = lazy(() => import("./pages/admin/AdminProductEditor.tsx"));
const AdminBlogPage = lazy(() => import("./pages/admin/AdminBlog.tsx"));
const AdminPostEditorPage = lazy(() => import("./pages/admin/AdminPostEditor.tsx"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center">
              <span className="text-sm text-muted-foreground">Loading…</span>
            </div>
          }
        >
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/mistakes" element={<MistakesPage />} />
          <Route path="/guides" element={<GuidesPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/shop/:slug" element={<ShopProductPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/guides/:slug" element={<GuideOverviewPage />} />
          <Route path="/guides/:slug/:articleSlug" element={<GuideArticlePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/billing/checkout" element={<BillingCheckoutPage />} />
          <Route path="/billing/success" element={<BillingSuccessPage />} />
          <Route path="/billing/cancel" element={<BillingCancelPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/mistakes" element={<AdminMistakesPage />} />
          <Route path="/admin/mistakes/new" element={<AdminMistakeEditorPage />} />
          <Route path="/admin/mistakes/:id" element={<AdminMistakeEditorPage />} />
          <Route path="/admin/guides" element={<AdminGuidesPage />} />
          <Route path="/admin/guides/new" element={<AdminGuideEditorPage />} />
          <Route path="/admin/guides/:id" element={<AdminGuideEditorPage />} />
          <Route path="/admin/articles/new" element={<AdminArticleEditorPage />} />
          <Route path="/admin/articles/:id" element={<AdminArticleEditorPage />} />
          <Route path="/admin/categories" element={<AdminCategoriesPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/products" element={<AdminProductsPage />} />
          <Route path="/admin/products/new" element={<AdminProductEditorPage />} />
          <Route path="/admin/products/:id" element={<AdminProductEditorPage />} />
          <Route path="/admin/blog" element={<AdminBlogPage />} />
          <Route path="/admin/blog/new" element={<AdminPostEditorPage />} />
          <Route path="/admin/blog/:id" element={<AdminPostEditorPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
