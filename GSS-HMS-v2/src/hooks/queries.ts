import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  staffApi, patientsApi, labApi, tokensApi, documentsApi,
  announcementsApi, attendanceApi, leaveApi, payrollApi,
  inventoryApi, usersApi, schedulesApi, dashboardApi,
  pharmacyApi, billingApi, medicineAdminApi,
  performanceEvalApi,
} from "@/services/api";

const errMsg = (e: unknown) => (e as any)?.response?.data?.error || (e as Error).message || "Something went wrong";

// ─── Dashboard ──────────────────────────────────────────────
export function useDashboardStats() {
  return useQuery({ queryKey: ["dashboard"], queryFn: () => dashboardApi.stats().then((r) => r.data) });
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

// ─── Patients ───────────────────────────────────────────────
export function usePatients() {
  return useQuery({ queryKey: ["patients"], queryFn: () => patientsApi.list().then((r) => r.data) });
}
export function useCreatePatient() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: Record<string, unknown>) => patientsApi.create(d).then((r) => r.data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["patients"] }); toast.success("Patient registered"); }, onError: (e) => toast.error(errMsg(e)) });
}
export function useUpdatePatient() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...d }: Record<string, unknown> & { id: string }) => patientsApi.update(id, d).then((r) => r.data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["patients"] }); toast.success("Patient updated"); }, onError: (e) => toast.error(errMsg(e)) });
}
export function useDeletePatient() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => patientsApi.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ["patients"] }); toast.success("Patient removed"); }, onError: (e) => toast.error(errMsg(e)) });
}
export function usePermanentDeletePatient() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => patientsApi.permanentDelete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ["patients"] }); toast.success("Patient permanently deleted"); }, onError: (e) => toast.error(errMsg(e)) });
}

// ─── Patient Documents ──────────────────────────────────────
export function usePatientDocuments(patientId: string) {
  return useQuery({ queryKey: ["patient-documents", patientId], queryFn: () => patientsApi.listDocuments(patientId).then((r) => r.data), enabled: !!patientId });
}
export function useUploadPatientDocument() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ patientId, ...d }: Record<string, unknown> & { patientId: string }) => patientsApi.uploadDocument(patientId, d).then((r) => r.data), onSuccess: (_d, vars) => { qc.invalidateQueries({ queryKey: ["patient-documents", vars.patientId] }); toast.success("Document uploaded"); }, onError: (e) => toast.error(errMsg(e)) });
}
export function useDeletePatientDocument() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ patientId, docId }: { patientId: string; docId: string }) => patientsApi.deleteDocument(patientId, docId), onSuccess: (_d, vars) => { qc.invalidateQueries({ queryKey: ["patient-documents", vars.patientId] }); toast.success("Document deleted"); }, onError: (e) => toast.error(errMsg(e)) });
}

// ─── Lab Tests ──────────────────────────────────────────────
export function useLabTests() {
  return useQuery({ queryKey: ["lab-tests"], queryFn: () => labApi.list().then((r) => r.data) });
}
export function useCreateLabTest() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: Record<string, unknown>) => labApi.create(d).then((r) => r.data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["lab-tests"] }); toast.success("Lab test ordered"); }, onError: (e) => toast.error(errMsg(e)) });
}
export function useUpdateLabTestStatus() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...d }: Record<string, unknown> & { id: string }) => labApi.updateStatus(id, d).then((r) => r.data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["lab-tests"] }); toast.success("Lab test status updated"); }, onError: (e) => toast.error(errMsg(e)) });
}
export function useUpdateLabTest() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...d }: Record<string, unknown> & { id: string }) => labApi.update(id, d).then((r) => r.data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["lab-tests"] }); toast.success("Lab test updated"); }, onError: (e) => toast.error(errMsg(e)) });
}

// ─── OPD Tokens ─────────────────────────────────────────────
export function useTokens() {
  return useQuery({ queryKey: ["tokens"], queryFn: () => tokensApi.list().then((r) => r.data) });
}
export function useCreateToken() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: Record<string, unknown>) => tokensApi.create(d).then((r) => r.data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["tokens"] }); toast.success("OPD token generated"); }, onError: (e) => toast.error(errMsg(e)) });
}
export function useUpdateTokenStatus() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, status }: { id: string; status: string }) => tokensApi.updateStatus(id, status).then((r) => r.data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["tokens"] }); toast.success("Token status updated"); }, onError: (e) => toast.error(errMsg(e)) });
}

// ─── Documents ──────────────────────────────────────────────
export function useDocuments() {
  return useQuery({ queryKey: ["documents"], queryFn: () => documentsApi.list().then((r) => r.data) });
}
export function useCreateDocument() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: Record<string, unknown>) => documentsApi.create(d).then((r) => r.data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["documents"] }); toast.success("Document uploaded"); }, onError: (e) => toast.error(errMsg(e)) });
}
export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => documentsApi.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ["documents"] }); toast.success("Document deleted"); }, onError: (e) => toast.error(errMsg(e)) });
}

// ─── Announcements ──────────────────────────────────────────
export function useAnnouncements() {
  return useQuery({ queryKey: ["announcements"], queryFn: () => announcementsApi.list().then((r) => r.data) });
}
export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: Record<string, unknown>) => announcementsApi.create(d).then((r) => r.data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["announcements"] }); toast.success("Announcement published"); }, onError: (e) => toast.error(errMsg(e)) });
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
export function useApplyLeave() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: Record<string, unknown>) => leaveApi.apply(d).then((r) => r.data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["leave"] }); toast.success("Leave application submitted"); }, onError: (e) => toast.error(errMsg(e)) });
}
export function useUpdateLeaveStatus() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, status }: { id: string; status: string }) => leaveApi.updateStatus(id, status).then((r) => r.data), onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: ["leave"] }); toast.success(`Leave ${v.status.toLowerCase()}`); }, onError: (e) => toast.error(errMsg(e)) });
}

// ─── Payroll ────────────────────────────────────────────────
export function usePayroll() {
  return useQuery({ queryKey: ["payroll"], queryFn: () => payrollApi.list().then((r) => r.data) });
}
export function useCreatePayroll() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: Record<string, unknown>) => payrollApi.create(d).then((r) => r.data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["payroll"] }); toast.success("Payroll entry created"); }, onError: (e) => toast.error(errMsg(e)) });
}

// ─── Inventory ──────────────────────────────────────────────
export function useInventory() {
  return useQuery({ queryKey: ["inventory"], queryFn: () => inventoryApi.list().then((r) => r.data) });
}
export function useCreateInventoryItem() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: Record<string, unknown>) => inventoryApi.create(d).then((r) => r.data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["inventory"] }); toast.success("Inventory item added"); }, onError: (e) => toast.error(errMsg(e)) });
}
export function useUpdateInventoryItem() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...d }: Record<string, unknown> & { id: string }) => inventoryApi.update(id, d).then((r) => r.data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["inventory"] }); toast.success("Inventory updated"); }, onError: (e) => toast.error(errMsg(e)) });
}
export function useDeleteInventoryItem() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => inventoryApi.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ["inventory"] }); toast.success("Inventory item removed"); }, onError: (e) => toast.error(errMsg(e)) });
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

// ─── Schedules ──────────────────────────────────────────────
export function useSchedules() {
  return useQuery({ queryKey: ["schedules"], queryFn: () => schedulesApi.list().then((r) => r.data) });
}
export function useCreateSchedule() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: Record<string, unknown>) => schedulesApi.create(d).then((r) => r.data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["schedules"] }); toast.success("Schedule created"); }, onError: (e) => toast.error(errMsg(e)) });
}
export function useUpdateSchedule() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...d }: Record<string, unknown> & { id: string }) => schedulesApi.update(id, d).then((r) => r.data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["schedules"] }); toast.success("Schedule updated"); }, onError: (e) => toast.error(errMsg(e)) });
}
export function useDeleteSchedule() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => schedulesApi.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ["schedules"] }); toast.success("Schedule deleted"); }, onError: (e) => toast.error(errMsg(e)) });
}
export function usePermanentDeleteSchedule() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => schedulesApi.permanentDelete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ["schedules"] }); toast.success("Schedule permanently deleted"); }, onError: (e) => toast.error(errMsg(e)) });
}

// ─── Missing hooks (Lab delete, Announcement CRUD, Payroll status) ──
export function useDeleteLabTest() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => labApi.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ["lab-tests"] }); toast.success("Lab test deleted"); }, onError: (e) => toast.error(errMsg(e)) });
}
export function usePermanentDeleteLabTest() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => labApi.permanentDelete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ["lab-tests"] }); toast.success("Lab test permanently deleted"); }, onError: (e) => toast.error(errMsg(e)) });
}
export function useUpdateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...d }: Record<string, unknown> & { id: string }) => announcementsApi.update(id, d).then((r) => r.data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["announcements"] }); toast.success("Announcement updated"); }, onError: (e) => toast.error(errMsg(e)) });
}
export function useDeleteAnnouncement() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => announcementsApi.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ["announcements"] }); toast.success("Announcement deleted"); }, onError: (e) => toast.error(errMsg(e)) });
}
export function usePermanentDeleteAnnouncement() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => announcementsApi.permanentDelete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ["announcements"] }); toast.success("Announcement permanently deleted"); }, onError: (e) => toast.error(errMsg(e)) });
}
export function useUpdatePayrollStatus() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, status }: { id: string; status: string }) => payrollApi.updateStatus(id, status).then((r) => r.data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["payroll"] }); toast.success("Payroll status updated"); }, onError: (e) => toast.error(errMsg(e)) });
}
export function useDeletePayroll() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => payrollApi.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ["payroll"] }); toast.success("Payroll entry deleted"); }, onError: (e) => toast.error(errMsg(e)) });
}
export function useCancelLeave() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => leaveApi.cancel(id).then((r) => r.data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["leave"] }); toast.success("Leave request cancelled"); }, onError: (e) => toast.error(errMsg(e)) });
}

// ─── Pharmacy ───────────────────────────────────────────────
export function usePrescriptions() {
  return useQuery({ queryKey: ["pharmacy"], queryFn: () => pharmacyApi.list().then((r) => r.data) });
}
export function useCreatePrescription() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: Record<string, unknown>) => pharmacyApi.create(d).then((r) => r.data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["pharmacy"] }); toast.success("Prescription created"); }, onError: (e) => toast.error(errMsg(e)) });
}
export function useUpdatePrescription() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...d }: Record<string, unknown> & { id: string }) => pharmacyApi.update(id, d).then((r) => r.data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["pharmacy"] }); toast.success("Prescription updated"); }, onError: (e) => toast.error(errMsg(e)) });
}
export function useDispensePrescription() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...d }: Record<string, unknown> & { id: string }) => pharmacyApi.dispense(id, d).then((r) => r.data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["pharmacy"] }); toast.success("Prescription dispensed"); }, onError: (e) => toast.error(errMsg(e)) });
}
export function useDeletePrescription() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => pharmacyApi.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ["pharmacy"] }); toast.success("Prescription deleted"); }, onError: (e) => toast.error(errMsg(e)) });
}

// ─── Billing ────────────────────────────────────────────────
export function useBilling() {
  return useQuery({ queryKey: ["billing"], queryFn: () => billingApi.list().then((r) => r.data) });
}
export function useCreateBilling() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: Record<string, unknown>) => billingApi.create(d).then((r) => r.data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["billing"] }); toast.success("Invoice created"); }, onError: (e) => toast.error(errMsg(e)) });
}
export function useUpdateBilling() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...d }: Record<string, unknown> & { id: string }) => billingApi.update(id, d).then((r) => r.data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["billing"] }); toast.success("Invoice updated"); }, onError: (e) => toast.error(errMsg(e)) });
}
export function usePayBilling() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...d }: Record<string, unknown> & { id: string }) => billingApi.pay(id, d).then((r) => r.data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["billing"] }); toast.success("Payment recorded"); }, onError: (e) => toast.error(errMsg(e)) });
}
export function useDeleteBilling() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => billingApi.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ["billing"] }); toast.success("Invoice deleted"); }, onError: (e) => toast.error(errMsg(e)) });
}
export function usePermanentDeleteBilling() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => billingApi.permanentDelete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ["billing"] }); toast.success("Invoice permanently deleted"); }, onError: (e) => toast.error(errMsg(e)) });
}

// ─── Medicine Administration (Discrepancy Tracking) ─────────
export function useMedicineAdministrations() {
  return useQuery({ queryKey: ["medicine-admin"], queryFn: () => medicineAdminApi.list().then((r) => r.data) });
}
export function useMedicineDiscrepancies() {
  return useQuery({ queryKey: ["medicine-admin", "discrepancies"], queryFn: () => medicineAdminApi.discrepancies().then((r) => r.data) });
}
export function useCreateMedicineAdmin() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: Record<string, unknown>) => medicineAdminApi.create(d).then((r) => r.data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["medicine-admin"] }); toast.success("Administration recorded"); }, onError: (e) => toast.error(errMsg(e)) });
}
export function useResolveMedicineDiscrepancy() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...d }: Record<string, unknown> & { id: string }) => medicineAdminApi.resolve(id, d).then((r) => r.data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["medicine-admin"] }); toast.success("Discrepancy resolved"); }, onError: (e) => toast.error(errMsg(e)) });
}
export function useDeleteMedicineAdmin() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => medicineAdminApi.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ["medicine-admin"] }); toast.success("Record deleted"); }, onError: (e) => toast.error(errMsg(e)) });
}

// ─── Performance Evaluations ──────────────────────────────
export function usePerformanceEvaluations() {
  return useQuery({ queryKey: ["performance-evaluations"], queryFn: () => performanceEvalApi.list().then((r) => r.data) });
}
export function useCreatePerformanceEval() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: Record<string, unknown>) => performanceEvalApi.create(d).then((r) => r.data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["performance-evaluations"] }); toast.success("Evaluation submitted"); }, onError: (e) => toast.error(errMsg(e)) });
}
export function useUpdatePerformanceEval() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...d }: Record<string, unknown> & { id: string }) => performanceEvalApi.update(id, d).then((r) => r.data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["performance-evaluations"] }); toast.success("Evaluation updated"); }, onError: (e) => toast.error(errMsg(e)) });
}
export function useDeletePerformanceEval() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => performanceEvalApi.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ["performance-evaluations"] }); toast.success("Evaluation deleted"); }, onError: (e) => toast.error(errMsg(e)) });
}

// ─── Staff File Upload ───────────────────────────────────
export function useUploadStaffFile() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, file, fieldType }: { id: string; file: File; fieldType: "photo" | "aadhaar" }) => staffApi.uploadFile(id, file, fieldType).then((r) => r.data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["staff"] }); toast.success("File uploaded"); }, onError: (e) => toast.error(errMsg(e)) });
}
