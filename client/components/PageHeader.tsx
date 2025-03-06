import { MdArrowBack } from "react-icons/md";
import Link from "next/link";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  backUrl?: string;
}

export function PageHeader({
  title,
  subtitle,
  actions,
  backUrl,
}: PageHeaderProps) {
  return (
    <div className="bg-white shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            {backUrl && (
              <Link
                href={backUrl}
                className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-flex items-center gap-1"
              >
                <MdArrowBack className="w-4 h-4" />
                Back
              </Link>
            )}
            <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex space-x-3">{actions}</div>}
        </div>
      </div>
    </div>
  );
}
