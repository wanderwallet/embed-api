"use client";

import { getAuthToken, trpc } from "@/client/utils/trpc/trpc-client";
import { jwtDecode } from "jwt-decode";
import { useState } from "react";

export function ProtectedApiInteraction() {
  const { data, isLoading, error, refetch } = trpc.debugSession.useQuery();
  const [activeTab, setActiveTab] = useState<"jwt" | "user" | "session">("jwt");

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="w-6 h-6 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <svg
            className="w-5 h-5 text-red-400 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-red-700">{error.message}</span>
        </div>
      </div>
    );
  }

  const TabButton = ({
    tab,
    label,
  }: {
    tab: typeof activeTab;
    label: string;
  }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200
        ${
          activeTab === tab
            ? "bg-blue-100 text-blue-700"
            : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
        }`}
    >
      {label}
    </button>
  );

  const renderContent = () => {
    let content;
    switch (activeTab) {
      case "jwt":
        content = jwtDecode(getAuthToken() || "");
        break;
      case "user":
        content = data?.user;
        break;
      case "session":
        content = data?.session;
        break;
    }

    return (
      <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
        <pre className="whitespace-pre-wrap break-words">
          {JSON.stringify(content, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex space-x-2 bg-gray-100 p-1 rounded-md">
          <TabButton tab="jwt" label="JWT Token" />
          <TabButton tab="user" label="User Data" />
          <TabButton tab="session" label="Session Info" />
        </div>

        <button
          onClick={() => refetch()}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
        >
          <svg
            className="w-4 h-4 mr-1.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      </div>

      <div className="border border-gray-200 rounded-lg bg-white p-4">
        <div className="mb-3">
          <h3 className="text-lg font-medium text-gray-900">
            {activeTab === "jwt" && "JWT Token Details"}
            {activeTab === "user" && "User Information"}
            {activeTab === "session" && "Session Details"}
          </h3>
          <p className="text-sm text-gray-500">
            {activeTab === "jwt" && "Decoded JWT token content"}
            {activeTab === "user" && "Current user data from auth.users"}
            {activeTab === "session" && "Active session information"}
          </p>
        </div>

        {renderContent()}
      </div>
    </div>
  );
}
