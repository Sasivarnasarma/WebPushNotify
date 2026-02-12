import React from "react";
import { Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import AdminHomePage from "./pages/AdminHomePage";
import NotificationsPage from "./pages/NotificationsPage";
import SubscribersPage from "./pages/SubscribersPage";
import KeysPage from "./pages/KeysPage";
import NotificationDetailPage from "./pages/NotificationDetailPage";
import ProtectedRoute from "./components/ProtectedRoute";
import "./styles.css";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/notification" element={<NotificationDetailPage />} />

      <Route path="/admin" element={
        <ProtectedRoute>
          <AdminHomePage />
        </ProtectedRoute>
      } />
      <Route path="/admin/notifications" element={
        <ProtectedRoute>
          <NotificationsPage />
        </ProtectedRoute>
      } />
      <Route path="/admin/subscribers" element={
        <ProtectedRoute>
          <SubscribersPage />
        </ProtectedRoute>
      } />
      <Route path="/admin/keys" element={
        <ProtectedRoute>
          <KeysPage />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
