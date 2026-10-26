import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { NotificationProvider } from './context/NotificationContext.js';
import { MainLayout } from './components/layout/MainLayout.js';

import { Login } from './pages/Login.js';
import { OverviewDashboard } from './pages/OverviewDashboard.js';
import { InstitutionsList } from './pages/InstitutionsList.js';
import { InstitutionDetails } from './pages/InstitutionDetails.js';
import { FDRList } from './pages/FDRList.js';
import { FDRRegister } from './pages/FDRRegister.js';
import { FDRDetails } from './pages/FDRDetails.js';
import { DocumentUploadReview } from './pages/DocumentUploadReview.js';
import { DocumentVerificationQueue } from './pages/DocumentVerificationQueue.js';
import { MaturitySchedule } from './pages/MaturitySchedule.js';
import { RenewalRequests } from './pages/RenewalRequests.js';
import { RefundRequestsList } from './pages/RefundRequestsList.js';
import { RefundRequestDetails } from './pages/RefundRequestDetails.js';
import { AlertsNotifications } from './pages/AlertsNotifications.js';
import { ReportsAnalytics } from './pages/ReportsAnalytics.js';
import { AuditLogs } from './pages/AuditLogs.js';
import { UserManagement } from './pages/UserManagement.js';
import { Settings } from './pages/Settings.js';
import { BankVerificationHub } from './pages/BankVerificationHub.js';
import { TrustExposureDashboard } from './pages/TrustExposureDashboard.js';
import { PolicyAdequacyPage } from './pages/PolicyAdequacyPage.js';
import { Unauthorized } from './pages/Unauthorized.js';
import { NotFound } from './pages/NotFound.js';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<'admin' | 'officer' | 'institution' | 'trust'>;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-text-secondary text-sm">
        Verifying AICTE credentials...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<OverviewDashboard />} />
              <Route path="institutions" element={<InstitutionsList />} />
              <Route path="institutions/:id" element={<InstitutionDetails />} />
              <Route path="fdrs" element={<FDRList />} />
              <Route
                path="fdrs/register"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'officer', 'institution']}>
                    <FDRRegister />
                  </ProtectedRoute>
                }
              />
              <Route path="fdrs/:id" element={<FDRDetails />} />
              <Route
                path="documents/upload"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'officer', 'institution']}>
                    <DocumentUploadReview />
                  </ProtectedRoute>
                }
              />
              <Route
                path="documents/verification-queue"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'officer']}>
                    <DocumentVerificationQueue />
                  </ProtectedRoute>
                }
              />
              <Route path="maturity-schedule" element={<MaturitySchedule />} />
              <Route path="renewals" element={<RenewalRequests />} />
              <Route path="refunds" element={<RefundRequestsList />} />
              <Route path="refunds/:id" element={<RefundRequestDetails />} />
              <Route
                path="bank-verification"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'officer']}>
                    <BankVerificationHub />
                  </ProtectedRoute>
                }
              />
              <Route
                path="trust-exposure"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'officer', 'trust']}>
                    <TrustExposureDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="policies" element={<PolicyAdequacyPage />} />
              <Route path="notifications" element={<AlertsNotifications />} />
              <Route path="reports" element={<ReportsAnalytics />} />
              <Route
                path="audit-logs"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'officer']}>
                    <AuditLogs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="users"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <UserManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="settings"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'officer']}>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route path="unauthorized" element={<Unauthorized />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
