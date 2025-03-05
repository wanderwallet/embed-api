"use client";

import { ProtectedApiInteraction } from "@/client/components/ProtectedApiInteraction";
import { useAuth } from "@/client/hooks/useAuth";

export default function SettingsPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 rounded-full p-3">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-medium text-gray-900">
                User Profile
              </h2>
              <p className="text-sm text-gray-500">ID: {user.id}</p>
              {user.email && (
                <p className="text-sm text-gray-500">Email: {user.email}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">
            API Interactions
          </h2>
          <ProtectedApiInteraction />
        </div>
      </main>
    </div>
  );
}
