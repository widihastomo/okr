import { useState } from "react";
import { queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/sidebar";
import CompanyOKRs from "@/components/company-okrs";

export default function CompanyOKRsPage() {
  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/okrs'] });
    queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <CompanyOKRs onRefresh={refreshData} />
        </div>
      </main>
    </div>
  );
}