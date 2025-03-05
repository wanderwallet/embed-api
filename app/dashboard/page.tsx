"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/client/utils/trpc/trpc-client";
import { toast } from "sonner";
import { validateDomains } from "@/shared/validators/domains";

type ActiveView = "teams" | "applications";

export default function DashboardPage() {
  const [activeView, setActiveView] = useState<ActiveView>("teams");
  const { data: stats } = trpc.getStats.useQuery();

  const NavIcon = ({ children }: { children: React.ReactNode }) => (
    <div className="w-5 h-5 flex-shrink-0">{children}</div>
  );

  const SideNavItem = ({
    view,
    label,
    icon,
  }: {
    view: ActiveView;
    label: string;
    icon: React.ReactNode;
  }) => (
    <button
      onClick={() => setActiveView(view)}
      className={`cursor-pointer w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-md transition-colors duration-200
        ${
          activeView === view
            ? "bg-blue-50 text-blue-700 border border-blue-100"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        }`}
    >
      <NavIcon>{icon}</NavIcon>
      <span>{label}</span>
    </button>
  );

  const renderViewHeader = () => {
    const headers = {
      teams: "Team Management",
      applications: "Application Management",
    };

    return (
      <div className="border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-900">
          {headers[activeView]}
        </h1>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-3">
            <nav className="space-y-2 bg-white p-4 rounded-lg shadow-sm">
              <SideNavItem
                view="teams"
                label="Teams"
                icon={
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                }
              />
              <SideNavItem
                view="applications"
                label="Applications"
                icon={
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                    />
                  </svg>
                }
              />
            </nav>

            {/* Quick Stats */}
            <div className="mt-6 bg-white p-4 rounded-lg shadow-sm space-y-4">
              <h3 className="text-sm font-medium text-gray-500">Quick Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-xs text-gray-500">Teams</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {stats?.teams || 0}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-xs text-gray-500">Applications</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {stats?.applications || 0}
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="mt-8 lg:mt-0 lg:col-span-9">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              {renderViewHeader()}
              <div className="divide-y divide-gray-200">
                {activeView === "teams" && <TeamsView />}
                {activeView === "applications" && <ApplicationsView />}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

const inputStyles =
  "mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base py-2.5 px-3";
const selectStyles =
  "mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base py-2.5 px-3";
const textareaStyles =
  "mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base py-2.5 px-3";

function TeamsView() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const createTeamMutation = trpc.createTeam.useMutation({
    onSuccess: () => {
      toast.success("Team created successfully");
      utils.listTeams.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create team");
    },
  });

  const { data: teams, isLoading: isLoadingTeams } = trpc.listTeams.useQuery();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTeam, setNewTeam] = useState({
    name: "",
    slug: "",
  });

  const handleCreateTeam = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Show loading toast
      const loadingToast = toast.loading("Creating team...");

      try {
        const slug = newTeam.name
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "");

        await createTeamMutation.mutateAsync({
          name: newTeam.name,
          slug: slug,
        });

        setNewTeam({ name: "", slug: "" });
        setShowCreateForm(false);
      } catch {
        //
      } finally {
        toast.dismiss(loadingToast);
      }
    },
    [newTeam, createTeamMutation]
  );

  if (isLoadingTeams) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-pulse text-gray-500">Loading teams...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Teams</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          Create Team
        </button>
      </div>

      {showCreateForm && (
        <form
          onSubmit={handleCreateTeam}
          className="mb-6 p-6 bg-gray-50 rounded-lg"
        >
          <div className="space-y-6">
            <div>
              <label
                htmlFor="teamName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Team Name
              </label>
              <input
                type="text"
                id="teamName"
                value={newTeam.name}
                onChange={(e) =>
                  setNewTeam({ ...newTeam, name: e.target.value })
                }
                className={inputStyles}
                required
                disabled={createTeamMutation.isLoading}
                placeholder="Enter team name"
              />
              <p className="mt-2 text-sm text-gray-500">
                Slug:{" "}
                {newTeam.name
                  ? newTeam.name.toLowerCase().replace(/[^a-z0-9-]/g, "-")
                  : ""}
              </p>
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="cursor-pointer px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={createTeamMutation.isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="cursor-pointer px-6 py-2.5 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center space-x-2"
                disabled={createTeamMutation.isLoading}
              >
                {createTeamMutation.isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Creating...</span>
                  </>
                ) : (
                  "Create Team"
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {teams?.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            No teams created yet. Create your first team to get started.
          </div>
        ) : (
          teams?.map((team) => (
            <div
              key={team.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {team.name}
                </h3>
                <p className="text-sm text-gray-500">
                  Organization: {team.organization.name}
                </p>
              </div>
              <button
                onClick={() => router.push(`/dashboard/teams/${team.id}`)}
                className="text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                Manage →
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ApplicationsView() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const createAppMutation = trpc.createApplication.useMutation({
    onSuccess: () => {
      toast.success("Application created successfully");
      utils.listApplications.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create application");
    },
  });

  const { data: applications, isLoading: isLoadingApps } =
    trpc.listApplications.useQuery();
  const { data: teams, isLoading: isLoadingTeams } = trpc.listTeams.useQuery();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newApp, setNewApp] = useState({
    name: "",
    description: "",
    teamId: "",
    domains: [] as string[],
  });

  const [newDomain, setNewDomain] = useState("");

  const handleAddDomain = useCallback(() => {
    if (newDomain && !newApp.domains.includes(newDomain)) {
      const validationResult = validateDomains([...newApp.domains, newDomain]);

      if (!validationResult.valid) {
        toast.error(validationResult.error);
        return;
      }

      setNewApp((prev) => ({
        ...prev,
        domains: [...prev.domains, newDomain],
      }));
      setNewDomain("");
    }
  }, [newDomain, newApp.domains]);

  const handleRemoveDomain = useCallback((domain: string) => {
    setNewApp((prev) => ({
      ...prev,
      domains: prev.domains.filter((d) => d !== domain),
    }));
  }, []);

  const handleCreateApp = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Show loading toast
      const loadingToast = toast.loading("Creating application...");

      try {
        await createAppMutation.mutateAsync({
          name: newApp.name,
          description: newApp.description || undefined,
          teamId: newApp.teamId,
          domains: newApp.domains,
        });

        setNewApp({ name: "", description: "", teamId: "", domains: [] });
        setShowCreateForm(false);
      } catch {
        //
      } finally {
        toast.dismiss(loadingToast);
      }
    },
    [newApp, createAppMutation]
  );

  if (isLoadingApps || isLoadingTeams) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-pulse text-gray-500">
          Loading applications...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Applications</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
        >
          Create Application
        </button>
      </div>

      {showCreateForm && (
        <form
          onSubmit={handleCreateApp}
          className="mb-6 p-6 bg-gray-50 rounded-lg"
        >
          <div className="space-y-6">
            <div>
              <label
                htmlFor="appName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Application Name
              </label>
              <input
                type="text"
                id="appName"
                value={newApp.name}
                onChange={(e) => setNewApp({ ...newApp, name: e.target.value })}
                className={inputStyles}
                required
                placeholder="Enter application name"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description
              </label>
              <textarea
                id="description"
                value={newApp.description}
                onChange={(e) =>
                  setNewApp({ ...newApp, description: e.target.value })
                }
                rows={3}
                className={textareaStyles}
                placeholder="Enter application description"
              />
            </div>

            <div>
              <label
                htmlFor="teamId"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Team
              </label>
              <select
                id="teamId"
                value={newApp.teamId}
                onChange={(e) =>
                  setNewApp({ ...newApp, teamId: e.target.value })
                }
                className={selectStyles}
                required
              >
                <option value="">Select a team</option>
                {teams?.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name} ({team.organization.name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Domains
              </label>
              <div className="mt-1 flex space-x-2">
                <input
                  type="text"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="example.com"
                  className={inputStyles}
                />
                <button
                  type="button"
                  onClick={handleAddDomain}
                  className="cursor-pointer px-6 py-2.5 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {newApp.domains.map((domain) => (
                  <span
                    key={domain}
                    className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    {domain}
                    <button
                      type="button"
                      onClick={() => handleRemoveDomain(domain)}
                      className="ml-2 inline-flex text-blue-600 hover:text-blue-800 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="cursor-pointer px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={createAppMutation.isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="cursor-pointer px-6 py-2.5 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center space-x-2"
                disabled={createAppMutation.isLoading}
              >
                {createAppMutation.isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Creating...</span>
                  </>
                ) : (
                  "Create Application"
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {applications?.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            No applications created yet. Create your first application to get
            started.
          </div>
        ) : (
          applications?.map((app) => (
            <div
              key={app.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {app.name}
                </h3>
                <p className="text-sm text-gray-500">Team: {app.team.name}</p>
                {app.description && (
                  <p className="text-sm text-gray-500 mt-1">
                    {app.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => router.push(`/dashboard/applications/${app.id}`)}
                className="text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                Manage →
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
