import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentBans } from "@/components/dashboard/recent-bans";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { ActiveGuestlists } from "@/components/dashboard/active-guestlists";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { useWebSocket } from "@/hooks/use-websocket";

export default function DashboardPage() {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Initialize WebSocket connection
  useWebSocket();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col lg:pl-64">
        <Topbar 
          onMenuClick={() => setSidebarOpen(true)}
          title={t("dashboard")}
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          {/* Quick Stats */}
          <div className="mb-8">
            <StatsCards />
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Bans */}
            <div className="lg:col-span-2">
              <RecentBans />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <QuickActions />
              <ActiveGuestlists />
              <RecentActivity />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
