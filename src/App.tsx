import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from '@/pages/LandingPage';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminRoute } from '@/components/auth/AdminRoute';
import { BossmanRoute } from '@/components/auth/BossmanRoute';
import { GalaxyRoute } from '@/components/auth/GalaxyRoute';
import { RouteTitle } from '@/components/RouteTitle';

const MapPage = lazy(() => import('@/pages/MapPage').then(m => ({ default: m.MapPage })));
const MapLoadingPage = lazy(() => import('@/pages/MapLoadingPage').then(m => ({ default: m.MapLoadingPage })));
const PrivacyPolicyPage = lazy(() => import('@/pages/PrivacyPolicyPage').then(m => ({ default: m.PrivacyPolicyPage })));
const TermsPage = lazy(() => import('@/pages/TermsPage').then(m => ({ default: m.TermsPage })));
const CreditsPage = lazy(() => import('@/pages/CreditsPage').then(m => ({ default: m.CreditsPage })));
const AdminPage = lazy(() => import('@/pages/AdminPage').then(m => ({ default: m.AdminPage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const NewsPage = lazy(() => import('@/pages/NewsPage').then(m => ({ default: m.NewsPage })));
const BlogPage = lazy(() => import('@/pages/BlogPage').then(m => ({ default: m.BlogPage })));
const ServicesPage = lazy(() => import('@/pages/ServicesPage').then(m => ({ default: m.ServicesPage })));
const ArticlePage = lazy(() => import('@/pages/ArticlePage').then(m => ({ default: m.ArticlePage })));
const ArticleEditorPage = lazy(() => import('@/pages/ArticleEditorPage').then(m => ({ default: m.ArticleEditorPage })));
const ArticleDashboardPage = lazy(() => import('@/pages/ArticleDashboardPage').then(m => ({ default: m.ArticleDashboardPage })));
const FeedbackPage = lazy(() => import('@/pages/FeedbackPage').then(m => ({ default: m.FeedbackPage })));

function App() {
  return (
    <>
      <RouteTitle />
      <Suspense fallback={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a0a0a' }}>
          <div style={{ width: 32, height: 32, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      }>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/credits" element={<CreditsPage />} />
          <Route path="/map-loading" element={
            <GalaxyRoute>
              <MapLoadingPage />
            </GalaxyRoute>
          } />
          <Route path="/map" element={
            <GalaxyRoute>
              <MapPage />
            </GalaxyRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <AdminRoute>
              <Navigate to="/admin/audit" replace />
            </AdminRoute>
          } />
          <Route path="/admin/audit" element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          } />
          <Route path="/admin/users" element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          } />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/news/dashboard" element={
            <BossmanRoute>
              <ArticleDashboardPage />
            </BossmanRoute>
          } />
          <Route path="/news/editor" element={
            <BossmanRoute>
              <ArticleEditorPage />
            </BossmanRoute>
          } />
          <Route path="/news/editor/:id" element={
            <BossmanRoute>
              <ArticleEditorPage />
            </BossmanRoute>
          } />
          <Route path="/news/:slug" element={<ArticlePage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/feedback" element={
            <ProtectedRoute>
              <FeedbackPage />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
