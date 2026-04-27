import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  staffApi, attendanceApi, leaveApi, payrollApi,
  usersApi, dashboardApi, hospitalLicensesApi, settingsApi,
} from "@/services/api";

const errMsg = (e: unknown) => (e as any)?.response?.data?.error || (e as Error).message || "Something went wrong";

// ─── Dashboard ──────────────────────────────────────────────
export function useDashboardStats(period?: string) {
  return useQuery({ queryKey: ["dashboard", period || "monthly"], queryFn: () => dashboardApi.stats(period).then((r) => r.data) });
}
export function useAddressCertification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (certId: string) => dashboardApi.addressCertification(certId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["dashboard"] }); qc.invalidateQueries({ queryKey: ["staff-certs"] }); qc.invalidateQueries({ queryKey: ["staff"] }); qc.invalidateQueries({ queryKey: ["all-certifications"] }); toast.success("Certification marked as addressed"); },
    onError: (e) => toast.error(errMsg(e)),
  });
}

// ─── Staff ──────────────────────────────────────────────────
export function useStaff() {
  return useQuery({ queryKey: ["staff"], queryFn: () => staffApi.list().then((r) => r.data) });
}
export function useCreateStaff() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: Record<string, unknown>) => staffApi.create(d).then((r) => r.data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["staff"] }); toast.success("Staff member added"); }, onError: (e) => toast.error(errMsg(e)) });
}
export function useUpdateStaff() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...d }: Record<string, unknown> & { id: string }) => staffApi.update(id, d).then((r) => r.data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["staff"] }); toast.success("Staff member updated"); }, onError: (e) => toast.error(errMsg(e)) });
}
export function useDeleteStaff() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => staffApi.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ["staff"] }); toast.success("Staff member removed"); }, onError: (e) => toast.error(errMsg(e)) });
}
export function usePermanentDeleteStaff() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => staffApi.permanentDelete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ["staff"] }); toast.success("Staff member permanently deleted"); }, onError: (e) => toast.error(errMsg(e)) });
}
export function useUploadStaffFile() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, file, fieldType }: { id: string; file: File; fieldType: "photo" | "aadhaar" }) => staffApi.uploadFile(id, file, fieldType).then((r) => r.data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["staff"] }); toast.success("File uploaded"); }, onError: (e) => toast.error(errMsg(e)) });
}

// ─── Staff Documents ────────────────────────────────────────
export function useStaffDocuments(staffId: string) {
  return useQuery({ queryKey: ["staff-documents", staffId], queryFn: () => staffApi.listDocuments(staffId).then((r) => r.data), enabled: !!staffId });
}
export function useUploadStaffDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ staffId, file, category, documentType }: { staffId: string; file: File; category: "official" | "medical"; documentType: string }) =>
      staffApi.uploadDocument(staffId, file, category, documentType).then((r) => r.data),
    onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: ["staff-documents", v.staffId] }); toast.success("Document uploaded"); },
    onError: (e) => toast.error(errMsg(e)),
  });
}
export function useDeleteStaffDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ staffId, docId }: { staffId: string; docId: string }) => staffApi.deleteDocument(staffId, docId),
    onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: ["staff-documents", v.staffId] }); toast.success("Document deleted"); },
    onError: (e) => toast.error(errMsg(e)),
  });
}
export function useDocumentAsPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ staffId, documentId }: { staffId: string; documentId: string }) => staffApi.useDocumentAsPhoto(staffId, documentId).then((r) => r.data),
    onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: ["staff"] }); toast.success("Profile photo updated from document"); },
    onError: (e) => toast.error(errMsg(e)),
  });
}

// ─── Staff Certifications ───────────────────────────────────
export function useStaffCertifications(staffId: string) {
  return useQuery({ queryKey: ["staff-certs", staffId], queryFn: () => staffApi.listCertifications(staffId).then((r) => r.data), enabled: !!staffId });
}
export function useCreateCertification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ staffId, ...data }: { staffId: string; name: string; expiryDate: string; status: string }) =>
      staffApi.createCertification(staffId, data).then((r) => r.data),
    onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: ["staff-certs", v.staffId] }); qc.invalidateQueries({ queryKey: ["staff"] }); toast.success("Certification added"); },
    onError: (e) => toast.error(errMsg(e)),
  });
}
export function useUpdateCertification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ staffId, certId, ...data }: { staffId: string; certId: string; name?: string; expiryDate?: string; status?: string }) =>
      staffApi.updateCertification(staffId, certId, data).then((r) => r.data),
    onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: ["staff-certs", v.staffId] }); qc.invalidateQueries({ queryKey: ["staff"] }); toast.success("Certification updated"); },
    onError: (e) => toast.error(errMsg(e)),
  });
}
export function useDeleteCertification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ staffId, certId }: { staffId: string; certId: string }) => staffApi.deleteCertification(staffId, certId),
    onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: ["staff-certs", v.staffId] }); qc.invalidateQueries({ queryKey: ["staff"] }); toast.success("Certification deleted"); },
    onError: (e) => toast.error(errMsg(e)),
  });
}
export function useUploadCertificationFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ staffId, certId, file }: { staffId: string; certId: string; file: File }) =>
      staffApi.uploadCertification(staffId, certId, file).then((r) => r.data),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["staff-certs", v.staffId] });
      qc.invalidateQueries({ queryKey: ["all-certifications"] });
      qc.invalidateQueries({ queryKey: ["staff"] });
      toast.success("Certificate file uploaded");
    },
    onError: (e) => toast.error(errMsg(e)),
  });
}

// ─── Attendance ─────────────────────────────────────────────
export function useAttendance() {
  return useQuery({ queryKey: ["attendance"], queryFn: () => attendanceApi.list().then((r) => r.data) });
}
export function useCreateAttendance() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: Record<string, unknown>) => attendanceApi.create(d).then((r) => r.data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["attendance"] }); toast.success("Attendance recorded"); }, onError: (e) => toast.error(errMsg(e)) });
}
export function useUpdateAttendance() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...d }: Record<string, unknown> & { id: string }) => attendanceApi.update(id, d).then((r) => r.data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["attendance"] }); toast.success("Attendance updated"); }, onError: (e) => toast.error(errMsg(e)) });
}

// ─── Leave ──────────────────────────────────────────────────
export function useLeaveRequests() {
  return useQuery({ queryKey: ["leave"], queryFn: () => leaveApi.list().then((r) => r.data) });
}
export function useLeaveTypes() {
  return useQuery({ queryKey: ["leave-types"], queryFn: () => leaveApi.listTypes().then((r) => r.data) });
}
export function useCreateLeaveType() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: { name: string }) => leaveApi.createType(d).then((r) => r.data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["leave-types"] }); toast.success("Leave type created"); }, onError: (e) => toast.error(errMsg(e)) });
}
export function useDeleteLeaveType() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => leaveApi.deleteType(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ["leave-types"] }); toast.success("Leave type removed"); }, onError: (e) => toast.error(errMsg(e)) });
}
export function useApplyLeave() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: Record<string, unknown>) => leaveApi.apply(d).then((r) => r.data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["leave"] }); toast.success("Leave application submitted"); }, onError: (e) => toast.error(errMsg(e)) });
}
export function useUpdateLeaveStatus() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, status }: { id: string; status: string }) => leaveApi.updateStatus(id, status).then((r) => r.data), onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: ["leave"] }); toast.success(`Leave ${v.status.toLowerCase()}`); }, onError: (e) => toast.error(errMsg(e)) });
}
export function useCancelLeave() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => leaveApi.cancel(id).then((r) => r.data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["leave"] }); toast.success("Leave request cancelled"); }, onError: (e) => toast.error(errMsg(e)) });
}

// ─── Payroll ────────────────────────────────────────────────
export function usePayroll() {
  return useQuery({ queryKey: ["payroll"], queryFn: () => payrollApi.list().then((r) => r.data) });
}
export function useCreatePayroll() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: Record<string, unknown>) => payrollApi.create(d).then((r) => r.data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["payroll"] }); toast.success("Payroll entry created"); }, onError: (e) => toast.error(errMsg(e)) });
}
export function useGeneratePayroll() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: { month: string; year: string; staffIds?: string[] }) => payrollApi.generate(d).then((r) => r.data), onSuccess: (data: any) => { qc.invalidateQueries({ queryKey: ["payroll"] }); toast.success(`Generated ${data.generated} payroll records`); }, onError: (e) => toast.error(errMsg(e)) });
}
export function useUpdatePayrollStatus() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, status }: { id: string; status: string }) => payrollApi.updateStatus(id, status).then((r) => r.data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["payroll"] }); toast.success("Payroll status updated"); }, onError: (e) => toast.error(errMsg(e)) });
}
export function useDeletePayroll() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => payrollApi.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ["payroll"] }); toast.success("Payroll entry deleted"); }, onError: (e) => toast.error(errMsg(e)) });
}

// ─── Users ──────────────────────────────────────────────────
export function useUsers() {
  return useQuery({ queryKey: ["users"], queryFn: () => usersApi.list().then((r) => r.data) });
}
export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: Record<string, unknown>) => usersApi.create(d).then((r) => r.data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); toast.success("User created"); }, onError: (e) => toast.error(errMsg(e)) });
}
export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...d }: Record<string, unknown> & { id: string }) => usersApi.update(id, d).then((r) => r.data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); toast.success("User updated"); }, onError: (e) => toast.error(errMsg(e)) });
}
export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => usersApi.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); toast.success("User deleted"); }, onError: (e) => toast.error(errMsg(e)) });
}
export function usePermanentDeleteUser() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => usersApi.permanentDelete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); toast.success("User permanently deleted"); }, onError: (e) => toast.error(errMsg(e)) });
}

// ─── Hospital Licenses ──────────────────────────────────────
export function useHospitalLicenses() {
  return useQuery({ queryKey: ["hospital-licenses"], queryFn: () => hospitalLicensesApi.list().then((r) => r.data) });
}
export function useCreateHospitalLicense() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: Record<string, unknown>) => hospitalLicensesApi.create(d).then((r) => r.data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["hospital-licenses"] }); toast.success("License added"); }, onError: (e) => toast.error(errMsg(e)) });
}
export function useUpdateHospitalLicense() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...d }: Record<string, unknown> & { id: string }) => hospitalLicensesApi.update(id, d).then((r) => r.data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["hospital-licenses"] }); toast.success("License updated"); }, onError: (e) => toast.error(errMsg(e)) });
}
export function useDeleteHospitalLicense() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => hospitalLicensesApi.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ["hospital-licenses"] }); toast.success("License removed"); }, onError: (e) => toast.error(errMsg(e)) });
}
export function useUploadHospitalLicense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => hospitalLicensesApi.upload(id, file).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hospital-licenses"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); toast.success("Document uploaded"); },
    onError: (e) => toast.error(errMsg(e)),
  });
}
export function useAddressHospitalLicense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hospitalLicensesApi.address(id).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hospital-licenses"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); toast.success("License marked as addressed"); },
    onError: (e) => toast.error(errMsg(e)),
  });
}
export function useUnaddressHospitalLicense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hospitalLicensesApi.unaddress(id).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hospital-licenses"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); toast.success("License reopened"); },
    onError: (e) => toast.error(errMsg(e)),
  });
}
export function useAllCertifications() {
  return useQuery({ queryKey: ["all-certifications"], queryFn: () => dashboardApi.allCertifications().then((r) => r.data as any[]) });
}
export function useUnaddressCertification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (certId: string) => dashboardApi.unaddressCertification(certId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["all-certifications"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); toast.success("Certification reopened"); },
    onError: (e) => toast.error(errMsg(e)),
  });
}

// ─── Settings (Hospital / OPD) ──────────────────────────────
export function useHospitalSettings() {
  return useQuery({ queryKey: ["settings-hospital"], queryFn: () => settingsApi.getHospital().then((r) => r.data) });
}
export function useSaveHospitalSettings() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: Record<string, unknown>) => settingsApi.saveHospital(d).then((r) => r.data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["settings-hospital"] }); toast.success("Hospital information saved"); }, onError: (e) => toast.error(errMsg(e)) });
}
export function useOPDSettings() {
  return useQuery({ queryKey: ["settings-opd"], queryFn: () => settingsApi.getOPD().then((r) => r.data) });
}
export function useSaveOPDSettings() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: Record<string, unknown>) => settingsApi.saveOPD(d).then((r) => r.data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["settings-opd"] }); toast.success("OPD settings saved"); }, onError: (e) => toast.error(errMsg(e)) });
}
