"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/client/utils/trpc/trpc-client";
import { toast } from "sonner";
import {
  LoadingSpinner,
  LoadingPage,
} from "@/client/components/LoadingSpinner";
import { CopyButton } from "@/client/components/CopyButton";
import { Modal } from "@/client/components/Modal";
import { PageHeader } from "@/client/components/PageHeader";
import { validateDomains } from "@/shared/validators/domains";

const inputStyles =
  "mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base py-2.5 px-3";
const textareaStyles = inputStyles;

export default function ApplicationDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { data: app, isLoading } = trpc.getApplication.useQuery({
    id: params.id,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    domains: [] as string[],
  });
  const [newDomain, setNewDomain] = useState("");

  const updateAppMutation = trpc.updateApplication.useMutation({
    onSuccess: () => {
      toast.success("Application updated successfully");
      setIsEditing(false);
      utils.getApplication.invalidate({ id: params.id });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update application");
    },
  });

  const deleteAppMutation = trpc.deleteApplication.useMutation({
    onSuccess: () => {
      toast.success("Application deleted successfully");
      router.push("/dashboard");
      utils.listApplications.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete application");
    },
  });

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!app) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader
          title="Application not found"
          backUrl="/dashboard?tab=applications"
        />
      </div>
    );
  }

  const handleEdit = () => {
    setEditForm({
      name: app.name,
      description: app.description || "",
      domains: app.domains,
    });
    setIsEditing(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateAppMutation.mutateAsync({
      id: app.id,
      name: editForm.name,
      description: editForm.description,
      domains: editForm.domains,
    });
  };

  const handleDelete = async () => {
    await deleteAppMutation.mutateAsync({ id: app.id });
  };

  const handleAddDomain = () => {
    if (newDomain && !editForm.domains.includes(newDomain)) {
      const updatedDomains = [...editForm.domains, newDomain];
      const validationResult = validateDomains(updatedDomains);

      if (!validationResult.valid) {
        toast.error(validationResult.error);
        return;
      }

      setEditForm((prev) => ({
        ...prev,
        domains: updatedDomains,
      }));
      setNewDomain("");
    }
  };

  const handleRemoveDomain = (domain: string) => {
    setEditForm((prev) => ({
      ...prev,
      domains: prev.domains.filter((d) => d !== domain),
    }));
  };

  const headerActions = (
    <>
      <button
        onClick={handleEdit}
        className="cursor-pointer px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Edit
      </button>
      <button
        onClick={() => setShowDeleteConfirm(true)}
        className="cursor-pointer px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
      >
        Delete
      </button>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <PageHeader
          title={app.name}
          subtitle={`Team: ${app.team.name}`}
          actions={headerActions}
          backUrl="/dashboard?tab=applications"
        />
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4">
            {/* Application Info */}
            {!isEditing && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700">
                    Application ID
                  </h3>
                  <div className="mt-2">
                    <CopyButton text={app.id} label={app.id} />
                  </div>
                </div>

                {app.description && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">
                      Description
                    </h3>
                    <p className="mt-1 text-gray-600">{app.description}</p>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-gray-700">
                    Client ID
                  </h3>
                  <div className="mt-2">
                    {app.clientId ? (
                      <CopyButton text={app.clientId} label={app.clientId} />
                    ) : (
                      <span className="text-sm text-gray-500">
                        No Client ID available
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700">Domains</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {app.domains.map((domain) => (
                      <span
                        key={domain}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        {domain}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Edit Form */}
            {isEditing && (
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Application Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    className={inputStyles}
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                    rows={3}
                    className={textareaStyles}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
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
                      className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 cursor-pointer inline-flex items-center space-x-2"
                    >
                      <span>Add</span>
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {editForm.domains.map((domain) => (
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

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed inline-flex items-center space-x-2"
                    disabled={updateAppMutation.isLoading}
                  >
                    {updateAppMutation.isLoading ? (
                      <>
                        <LoadingSpinner />
                        <span>Saving...</span>
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Delete Confirmation Modal */}
            <Modal
              isOpen={showDeleteConfirm}
              onClose={() => setShowDeleteConfirm(false)}
              title="Delete Application"
            >
              <div>
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this application? This action
                  cannot be undone.
                </p>
                <div className="mt-4 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed inline-flex items-center space-x-2"
                    disabled={deleteAppMutation.isLoading}
                  >
                    {deleteAppMutation.isLoading ? (
                      <>
                        <LoadingSpinner />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      "Delete"
                    )}
                  </button>
                </div>
              </div>
            </Modal>
          </div>
        </div>
      </div>
    </div>
  );
}
