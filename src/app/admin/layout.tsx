import React from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminWorkspaceLayout } from '@/routes/AppRoutes';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminWorkspaceLayout>
      <div className="min-h-screen bg-[#f4f6f8] flex font-sans antialiased text-slate-900">
        {/* Persistent Dual-Tier Apple Sidebar */}
        <AdminSidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
          {/* Dynamic Microsoft/Apple ERP Top Navigation Bar */}
          <AdminHeader />

          {/* Page Canvas */}
          <main className="flex-1 p-5 md:p-6 bg-[#f4f6f8]">{children}</main>
        </div>
      </div>
    </AdminWorkspaceLayout>
  );
}
