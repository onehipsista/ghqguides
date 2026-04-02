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
import NotFound from "./pages/NotFound.tsx";

// Lazy — article page pulls in react-markdown + remark-gfm
const GuideArticlePage = lazy(() => import("./pages/GuideArticle.tsx"));

// Lazy — admin pages pull in SimpleMDE/EasyMDE (~900 KB) only when visited
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboard.tsx"));
const AdminMistakesPage = lazy(() => import("./pages/admin/AdminMistakes.tsx"));
const AdminMistakeEditorPage = lazy(() => import("./pages/admin/AdminMistakeEditor.tsx"));
const AdminGuidesPage = lazy(() => import("./pages/admin/AdminGuides.tsx"));
const AdminGuideEditorPage = lazy(() => import("./pages/admin/AdminGuideEditor.tsx"));
const AdminArticleEditorPage = lazy(() => import("./pages/admin/AdminArticleEditor.tsx"));
const AdminCategoriesPage = lazy(() => import("./pages/admin/AdminCategories.tsx"));
const AdminUsersPage = lazy(() => import("./pages/admin/AdminUsers.tsx"));

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
          <Route path="/guides/:slug" element={<GuideOverviewPage />} />
          <Route path="/guides/:slug/:articleSlug" element={<GuideArticlePage />} />
          <Route path="/login" element={<LoginPage />} />
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
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
