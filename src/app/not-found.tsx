import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Briefcase } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="text-center space-y-4 max-w-md">
        <div className="inline-flex p-3 bg-blue-100 text-[#1e3a8a] rounded-2xl">
          <Briefcase className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">404 - Page Not Found</h1>
        <p className="text-sm text-slate-600">
          The page or resource you are looking for does not exist or has been moved.
        </p>
        <div>
          <Link href="/">
            <Button>Return to Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
