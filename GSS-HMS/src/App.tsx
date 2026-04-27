import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { TooltipProvider } from "@/components/ui/tooltip";

import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import StaffDirectoryPage from "@/pages/StaffDirectoryPage";
import PayrollPage from "@/pages/PayrollPage";
import UserManagementPage from "@/pages/UserManagementPage";
import AttendancePage from "@/pages/AttendancePage";
import LeavePage from "@/pages/LeavePage";
import SettingsPage from "@/pages/SettingsPage";
import LicensesPage from "@/pages/LicensesPage";


const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
    <TooltipProvider delayDuration={300}>
    <ErrorBoundary>
    <Toaster position="top-right" richColors closeButton duration={3000} />
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected App Shell */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/staff" element={<ProtectedRoute requiredPermissions={["staff:read"]}><StaffDirectoryPage /></ProtectedRoute>} />
            <Route path="/attendance" element={<ProtectedRoute requiredPermissions={["attendance:read"]}><AttendancePage /></ProtectedRoute>} />
            <Route path="/leave" element={<ProtectedRoute requiredPermissions={["leave:apply"]}><LeavePage /></ProtectedRoute>} />
            <Route path="/payroll" element={<ProtectedRoute requiredPermissions={["payroll:read"]}><PayrollPage /></ProtectedRoute>} />
            <Route path="/licenses" element={<ProtectedRoute requiredPermissions={["staff:read"]}><LicensesPage /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute requiredPermissions={["users:read"]}><UserManagementPage /></ProtectedRoute>} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
    </ErrorBoundary>
    </TooltipProvider>
    </QueryClientProvider>
  );
}
