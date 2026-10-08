import apiClient from './client';

export interface ApiResponse<T = any> {
  success: boolean;
  status_code: number;
  message?: string;
  data: T;
  meta?: any;
}

export const hrApi = {
  // ---------- Dashboard & Stats ----------
  async getDashboardStats() {
    try {
      const [todayAtt, leavesRes, employeesRes, openPositionsRes] = await Promise.all([
        apiClient.get('/employees/me/attendance/today').catch(() => ({ data: null })),
        apiClient.get('/employees/leaves?status=pending').catch(() => ({ data: [], meta: { total: 0 } })),
        apiClient.get('/employees?limit=100').catch(() => ({ data: [], meta: { total: 0 } })),
        apiClient.get('/careers').catch(() => ({ data: [], meta: { total: 0 } })),
      ]);

      return {
        todayAttendance: todayAtt?.data || null,
        pendingLeavesCount: leavesRes?.meta?.total ?? (Array.isArray(leavesRes?.data) ? leavesRes.data.length : 0),
        totalEmployees: employeesRes?.meta?.total ?? (Array.isArray(employeesRes?.data) ? employeesRes.data.length : 0),
        openPositions: openPositionsRes?.meta?.total ?? (Array.isArray(openPositionsRes?.data) ? openPositionsRes.data.length : 0),
      };
    } catch {
      return {
        todayAttendance: null,
        pendingLeavesCount: 0,
        totalEmployees: 0,
        openPositions: 0,
      };
    }
  },

  // ---------- Employees ----------
  getEmployees(params: Record<string, any> = {}) {
    const qs = new URLSearchParams(params).toString();
    return apiClient.get<ApiResponse<any[]>>(`/employees${qs ? `?${qs}` : ''}`);
  },

  getEmployee(id: string) {
    return apiClient.get<ApiResponse<any>>(`/employees/${id}`);
  },

  getMyProfile() {
    return apiClient.get<ApiResponse<any>>('/employees/me/profile');
  },

  createEmployee(data: any) {
    return apiClient.post<ApiResponse<any>>('/employees', data);
  },

  updateEmployee(id: string, data: any) {
    return apiClient.put<ApiResponse<any>>(`/employees/${id}`, data);
  },

  deleteEmployee(id: string) {
    return apiClient.delete<ApiResponse<any>>(`/employees/${id}`);
  },

  // ---------- Users ----------
  getUsers(params: Record<string, any> = {}) {
    const qs = new URLSearchParams(params).toString();
    return apiClient.get<ApiResponse<any[]>>(`/users${qs ? `?${qs}` : ''}`);
  },

  createUser(data: any) {
    return apiClient.post<ApiResponse<any>>('/users', data);
  },

  // ---------- Departments ----------
  getDepartments(params: Record<string, any> = {}) {
    const qs = new URLSearchParams(params).toString();
    return apiClient.get<ApiResponse<any[]>>(`/departments${qs ? `?${qs}` : ''}`);
  },

  createDepartment(data: { name: string; description?: string }) {
    return apiClient.post<ApiResponse<any>>('/departments', data);
  },

  updateDepartment(id: string, data: { name?: string; description?: string }) {
    return apiClient.put<ApiResponse<any>>(`/departments/${id}`, data);
  },

  deleteDepartment(id: string) {
    return apiClient.delete<ApiResponse<any>>(`/departments/${id}`);
  },

  // ---------- Attendance ----------
  getMyTodayAttendance() {
    return apiClient.get<ApiResponse<any>>('/employees/me/attendance/today');
  },

  getMyAttendanceHistory(params: Record<string, any> = {}) {
    const qs = new URLSearchParams(params).toString();
    return apiClient.get<ApiResponse<any[]>>(`/employees/me/attendance${qs ? `?${qs}` : ''}`);
  },

  getAllAttendance(params: Record<string, any> = {}) {
    const qs = new URLSearchParams(params).toString();
    return apiClient.get<ApiResponse<any[]>>(`/employees/attendance${qs ? `?${qs}` : ''}`);
  },

  checkIn() {
    return apiClient.post<ApiResponse<any>>('/employees/me/attendance/check-in');
  },

  checkOut() {
    return apiClient.post<ApiResponse<any>>('/employees/me/attendance/check-out');
  },

  // ---------- Leave ----------
  getMyLeaves() {
    return apiClient.get<ApiResponse<any[]>>('/employees/me/leaves');
  },

  applyLeave(data: { type: string; start_date: string; end_date: string; reason?: string }) {
    return apiClient.post<ApiResponse<any>>('/employees/me/leaves', data);
  },

  getAllLeaves(params: Record<string, any> = {}) {
    const qs = new URLSearchParams(params).toString();
    return apiClient.get<ApiResponse<any[]>>(`/employees/leaves${qs ? `?${qs}` : ''}`);
  },

  approveLeave(leaveId: string, status: 'approved' | 'rejected') {
    return apiClient.patch<ApiResponse<any>>(`/employees/leaves/${leaveId}/approve`, { status });
  },

  // ---------- Timesheets ----------
  getMyTimesheets(params: Record<string, any> = {}) {
    const qs = new URLSearchParams(params).toString();
    return apiClient.get<ApiResponse<any[]>>(`/employees/me/timesheets${qs ? `?${qs}` : ''}`);
  },

  submitTimesheet(data: { date: string; hours: number; description?: string; project_id?: string; task_id?: string }) {
    return apiClient.post<ApiResponse<any>>('/employees/me/timesheets', data);
  },

  getAllTimesheets(params: Record<string, any> = {}) {
    const qs = new URLSearchParams(params).toString();
    return apiClient.get<ApiResponse<any[]>>(`/employees/timesheets${qs ? `?${qs}` : ''}`);
  },

  approveTimesheet(timesheetId: string, status: 'approved' | 'rejected') {
    return apiClient.patch<ApiResponse<any>>(`/employees/timesheets/${timesheetId}/approve`, { status });
  },

  // ---------- Payroll & Payslips ----------
  getMyPayslips() {
    return apiClient.get<ApiResponse<any[]>>('/employees/me/payslips');
  },

  getEmployeePayslips(employeeId: string) {
    return apiClient.get<ApiResponse<any[]>>(`/employees/${employeeId}/payslips`);
  },

  uploadPayslip(employeeId: string, formData: FormData) {
    return apiClient.post<ApiResponse<any>>(`/employees/${employeeId}/payslips`, formData);
  },

  // ---------- Performance & Goals ----------
  getMyPerformanceGoals() {
    return apiClient.get<ApiResponse<any[]>>('/employees/me/performance-goals');
  },

  getMyPerformanceReviews() {
    return apiClient.get<ApiResponse<any[]>>('/employees/me/performance-reviews');
  },

  getAllPerformanceGoals(params: Record<string, any> = {}) {
    const qs = new URLSearchParams(params).toString();
    return apiClient.get<ApiResponse<any[]>>(`/employees/performance-goals${qs ? `?${qs}` : ''}`);
  },

  createPerformanceGoal(data: any) {
    return apiClient.post<ApiResponse<any>>('/employees/performance-goals', data);
  },

  updatePerformanceGoal(id: string, data: any) {
    return apiClient.put<ApiResponse<any>>(`/employees/performance-goals/${id}`, data);
  },

  deletePerformanceGoal(id: string) {
    return apiClient.delete<ApiResponse<any>>(`/employees/performance-goals/${id}`);
  },

  getAllPerformanceReviews(params: Record<string, any> = {}) {
    const qs = new URLSearchParams(params).toString();
    return apiClient.get<ApiResponse<any[]>>(`/employees/performance-reviews${qs ? `?${qs}` : ''}`);
  },

  createPerformanceReview(data: any) {
    return apiClient.post<ApiResponse<any>>('/employees/performance-reviews', data);
  },

  acknowledgePerformanceReview(reviewId: string) {
    return apiClient.post<ApiResponse<any>>(`/employees/me/performance-reviews/${reviewId}/acknowledge`);
  },

  getMyFeedback() {
    return apiClient.get<ApiResponse<any[]>>('/employees/me/feedback');
  },

  sendFeedback(data: any) {
    return apiClient.post<ApiResponse<any>>('/employees/me/feedback', data);
  },

  // ---------- Training & Courses ----------
  getCourses(params: Record<string, any> = {}) {
    const qs = new URLSearchParams(params).toString();
    return apiClient.get<ApiResponse<any[]>>(`/trainings/courses${qs ? `?${qs}` : ''}`);
  },

  getCourse(id: string) {
    return apiClient.get<ApiResponse<any>>(`/trainings/courses/${id}`);
  },

  createCourse(data: any) {
    return apiClient.post<ApiResponse<any>>('/trainings/courses', data);
  },

  enrollCourse(courseId: string) {
    return apiClient.post<ApiResponse<any>>('/trainings/enroll', { course_id: courseId });
  },

  getMyEnrollments() {
    return apiClient.get<ApiResponse<any[]>>('/trainings/my-enrollments');
  },

  getAllEnrollments() {
    return apiClient.get<ApiResponse<any[]>>('/trainings/enrollments');
  },

  // ---------- Recruitment (ATS) ----------
  getCareers(params: Record<string, any> = {}) {
    const qs = new URLSearchParams(params).toString();
    return apiClient.get<ApiResponse<any[]>>(`/careers${qs ? `?${qs}` : ''}`);
  },

  createCareer(data: any) {
    return apiClient.post<ApiResponse<any>>('/careers', data);
  },

  getApplications(params: Record<string, any> = {}) {
    const qs = new URLSearchParams(params).toString();
    return apiClient.get<ApiResponse<any[]>>(`/careers/admin/applications${qs ? `?${qs}` : ''}`);
  },

  updateApplicationStatus(applicationId: string, status: string) {
    return apiClient.patch<ApiResponse<any>>(`/careers/admin/applications/${applicationId}/status`, { status });
  },

  // ---------- Documents ----------
  getMyDocuments() {
    return apiClient.get<ApiResponse<any[]>>('/employees/me/documents');
  },

  uploadMyDocument(formData: FormData) {
    return apiClient.post<ApiResponse<any>>('/employees/me/documents', formData);
  },

  getEmployeeDocuments(employeeId: string) {
    return apiClient.get<ApiResponse<any[]>>(`/employees/${employeeId}/documents`);
  },

  uploadEmployeeDocument(employeeId: string, formData: FormData) {
    return apiClient.post<ApiResponse<any>>(`/employees/${employeeId}/documents`, formData);
  },
};

export default hrApi;
