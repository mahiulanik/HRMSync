import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <div className="w-full lg:w-1/2 bg-sidebar flex flex-col justify-center px-8 sm:px-16 py-12 lg:py-0">
        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-6">
          HRMSync
        </h1>
        <p className="text-gray-400 text-base leading-relaxed max-w-md">
          Streamline your workforce operations, track attendance, manage
          payroll, and empower your team securely.
        </p>
      </div>
      <div className="w-full lg:w-1/2 bg-white flex flex-col justify-center px-8 sm:px-16 py-12 lg:py-0">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">Welcome Back</h2>
        <p className="text-text-secondary mb-8">
          Select your portal to securely access the system.
        </p>

        <div className="space-y-4">
          <button
            onClick={() => navigate("/admin/login")}
            className="w-full flex items-center justify-between p-5 border border-border rounded-xl hover:border-primary/30 hover:shadow-md transition-all group"
          >
            <span className="font-semibold text-lg">Admin Portal</span>
            <ArrowRight
              size={20}
              className="text-text-secondary group-hover:text-primary transition-colors"
            />
          </button>

          <button
            onClick={() => navigate("/employee/login")}
            className="w-full flex items-center justify-between p-5 border border-border rounded-xl hover:border-primary/30 hover:shadow-md transition-all group"
          >
            <span className="font-semibold text-lg">Employee Portal</span>
            <ArrowRight
              size={20}
              className="text-text-secondary group-hover:text-primary transition-colors"
            />
          </button>
        </div>

        <p className="text-sm text-text-secondary mt-12">
          &copy; 2026 Mahiul Hasan Anik. All rights reserved.
        </p>
      </div>
    </div>
  );
}
