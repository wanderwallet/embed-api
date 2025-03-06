"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/client/utils/trpc/trpc-client";
import { toast } from "sonner";
import {
  LoadingSpinner,
  LoadingPage,
} from "@/client/components/LoadingSpinner";
import { Modal } from "@/client/components/Modal";
import { PageHeader } from "@/client/components/PageHeader";

const inputStyles =
  "mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base py-2.5 px-3";

export default function TeamDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { data: team, isLoading } = trpc.getTeam.useQuery({ id: params.id });
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
  });

  const updateTeamMutation = trpc.updateTeam.useMutation({
    onSuccess: () => {
      toast.success("Team updated successfully");
      setIsEditing(false);
      utils.getTeam.invalidate({ id: params.id });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update team");
    },
  });

  const deleteTeamMutation = trpc.deleteTeam.useMutation({
    onSuccess: () => {
      toast.success("Team deleted successfully");
      router.push("/dashboard");
      utils.listTeams.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete team");
    },
  });

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <PageHeader title="Team not found" backUrl="/dashboard?tab=teams" />
        </div>
      </div>
    );
  }

  const handleEdit = () => {
    setEditForm({ name: team.name });
    setIsEditing(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateTeamMutation.mutateAsync({
      id: team.id,
      name: editForm.name,
    });
  };

  const handleDelete = async () => {
    await deleteTeamMutation.mutateAsync({ id: team.id });
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
          title={team.name}
          subtitle={`Organization: ${team.organization.name}`}
          actions={headerActions}
          backUrl="/dashboard?tab=teams"
        />
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4">
            {/* Team Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Members</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {team._count.memberships}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Applications</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {team._count.applications}
                </p>
              </div>
            </div>

            {/* Edit Form */}
            {isEditing && (
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Team Name
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
                    disabled={updateTeamMutation.isLoading}
                  >
                    {updateTeamMutation.isLoading ? (
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
              title="Delete Team"
            >
              <div>
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this team? This action cannot
                  be undone.
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
                    disabled={deleteTeamMutation.isLoading}
                  >
                    {deleteTeamMutation.isLoading ? (
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
