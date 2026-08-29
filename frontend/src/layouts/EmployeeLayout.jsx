import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function EmployeeLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-page-bg">
      <Sidebar
        role="EMPLOYEE"
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <main className="lg:ml-[250px] p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
        <Outlet />
      </main>
    </div>
  );
}
