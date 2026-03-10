import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";

import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import StaffDirectoryPage from "@/pages/StaffDirectoryPage";
import PatientsPage from "@/pages/PatientsPage";
import OPDPage from "@/pages/OPDPage";
import LaboratoryPage from "@/pages/LaboratoryPage";
import PayrollPage from "@/pages/PayrollPage";
import DocumentsPage from "@/pages/DocumentsPage";
import PerformancePage from "@/pages/PerformancePage";
import RosterPage from "@/pages/RosterPage";
import UserManagementPage from "@/pages/UserManagementPage";
import AnnouncementsPage from "@/pages/AnnouncementsPage";
import AttendancePage from "@/pages/AttendancePage";
import LeavePage from "@/pages/LeavePage";
import InsurancePage from "@/pages/InsurancePage";
import InventoryPage from "@/pages/InventoryPage";
import NurseManagementPage from "@/pages/NurseManagementPage";
import TechnicianPage from "@/pages/TechnicianPage";
import SchedulesPage from "@/pages/SchedulesPage";
import PharmacyPage from "@/pages/PharmacyPage";
import BillingPage from "@/pages/BillingPage";
import ReportsPage from "@/pages/ReportsPage";
import SettingsPage from "@/pages/SettingsPage";
import MedicineDiscrepancyPage from "@/pages/MedicineDiscrepancyPage";


const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
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
            <Route path="/patients" element={<ProtectedRoute requiredPermissions={["patient:read"]}><PatientsPage /></ProtectedRoute>} />
            <Route path="/opd" element={<ProtectedRoute requiredPermissions={["tokens:read"]}><OPDPage /></ProtectedRoute>} />
            <Route path="/laboratory" element={<ProtectedRoute requiredPermissions={["lab:read"]}><LaboratoryPage /></ProtectedRoute>} />
            <Route path="/payroll" element={<ProtectedRoute requiredPermissions={["payroll:read"]}><PayrollPage /></ProtectedRoute>} />
            <Route path="/documents" element={<ProtectedRoute requiredPermissions={["documents:read"]}><DocumentsPage /></ProtectedRoute>} />
            <Route path="/performance" element={<ProtectedRoute requiredPermissions={["performance:read"]}><PerformancePage /></ProtectedRoute>} />
            <Route path="/roster" element={<ProtectedRoute requiredPermissions={["roster:read"]}><RosterPage /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute requiredPermissions={["users:read"]}><UserManagementPage /></ProtectedRoute>} />
            <Route path="/announcements" element={<ProtectedRoute requiredPermissions={["announcements:read"]}><AnnouncementsPage /></ProtectedRoute>} />
            <Route path="/attendance" element={<ProtectedRoute requiredPermissions={["attendance:read"]}><AttendancePage /></ProtectedRoute>} />
            <Route path="/leave" element={<ProtectedRoute requiredPermissions={["leave:apply"]}><LeavePage /></ProtectedRoute>} />
            <Route path="/insurance" element={<ProtectedRoute requiredPermissions={["insurance:read"]}><InsurancePage /></ProtectedRoute>} />
            <Route path="/inventory" element={<ProtectedRoute requiredPermissions={["inventory:read"]}><InventoryPage /></ProtectedRoute>} />
            <Route path="/nurse-management" element={<ProtectedRoute requiredPermissions={["roster:write"]}><NurseManagementPage /></ProtectedRoute>} />
            <Route path="/technician" element={<ProtectedRoute requiredPermissions={["reports:match"]}><TechnicianPage /></ProtectedRoute>} />
            <Route path="/schedules" element={<ProtectedRoute requiredPermissions={["schedule:read"]}><SchedulesPage /></ProtectedRoute>} />
            <Route path="/pharmacy" element={<ProtectedRoute requiredPermissions={["patient:read"]}><PharmacyPage /></ProtectedRoute>} />
            <Route path="/billing" element={<ProtectedRoute requiredPermissions={["payroll:read"]}><BillingPage /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute requiredPermissions={["reports:read"]}><ReportsPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute requiredPermissions={["settings:read"]}><SettingsPage /></ProtectedRoute>} />
            <Route path="/medicine-discrepancy" element={<ProtectedRoute requiredPermissions={["patient:read"]}><MedicineDiscrepancyPage /></ProtectedRoute>} />
          </Route>

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
    </ErrorBoundary>
    </QueryClientProvider>
  );
}
