import { useState, useEffect } from "react";
import { ChevronLeft, Edit, Trash2 } from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import FormButton from "@/components/forms/FormButton";
import SearchBar from "@/components/forms/SearchBar";
import PageSpinner from "@/components/ui/PageSpinner";
import UserFormDialog from "@/components/dialogs/UserFormDialog";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import { listUsers, deleteUser } from "@/api/user";
import { toastError } from "@/utils/handleError";
import { roleLabel } from "@/utils/role";
import useAuthStore from "@/stores/useAuthStore";

const UserList = () => {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await listUsers();
      setUsers(res.data);
    } catch (error) {
      toastError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (user) => {
    setDeletingUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;
    try {
      await deleteUser(deletingUser.id);
      toast.success("ลบบัญชีผู้ใช้งานเรียบร้อยแล้ว");
      setIsDeleteDialogOpen(false);
      setDeletingUser(null);
      fetchUsers();
    } catch (error) {
      toastError(error);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setDeletingUser(null);
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setIsFormDialogOpen(true);
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const groupedByRole = {};
  filteredUsers.forEach((user) => {
    if (!groupedByRole[user.role]) {
      groupedByRole[user.role] = [];
    }
    groupedByRole[user.role].push(user);
  });

  Object.keys(groupedByRole).forEach((role) => {
    groupedByRole[role].sort((a, b) => a.id - b.id);
  });

  const sortedRoles = Object.keys(groupedByRole).sort((a, b) => {
    if (a === "ADMIN") return -1;
    if (b === "ADMIN") return 1;
    return 0;
  });

  return (
    <div className="bg-gradient-primary shadow-primary flex min-h-svh w-full flex-col">
      <div className="flex items-center gap-2 px-5 pt-4">
        <Link
          to="/dashboard"
          aria-label="ย้อนกลับ"
          className="bg-surface/20 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full"
        >
          <ChevronLeft className="text-surface" />
        </Link>
        <p className="text-surface text-2xl font-semibold md:text-[26px]">
          จัดการบัญชีผู้ใช้งาน
        </p>
      </div>
      <div className="bg-surface shadow-primary mt-4 flex w-full flex-1 flex-col rounded-tl-2xl rounded-tr-2xl pb-28 xl:pb-4">
        {isLoading ? (
          <PageSpinner />
        ) : (
          <div className="flex flex-1 flex-col px-5 pt-4">
            <div className="w-full">
              <SearchBar
                placeholder="ค้นหาชื่อ, อีเมล"
                value={searchTerm}
                onSearch={setSearchTerm}
              />
            </div>

            <FormButton
              label="+ เพิ่มบัญชีผู้ใช้งาน"
              onClick={() => {
                setEditingUser(null);
                setIsFormDialogOpen(true);
              }}
              className="bg-gradient-primary my-4 ml-0"
            />

            <UserFormDialog
              isOpen={isFormDialogOpen}
              onClose={() => {
                setIsFormDialogOpen(false);
                setEditingUser(null);
              }}
              editingItem={editingUser}
              isCurrentUser={editingUser?.id === currentUserId}
              onSuccess={fetchUsers}
            />

            <div className="flex flex-1 flex-col gap-4">
              {sortedRoles.map((role) => (
                <div
                  key={role}
                  className="bg-surface shadow-primary rounded-lg p-4"
                >
                  <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-4">
                    <p className="text-primary text-xl font-semibold md:text-[22px]">
                      {roleLabel(role)}
                      <span className="text-subtle-light ml-1.5 font-normal">
                        ({groupedByRole[role].length})
                      </span>
                    </p>
                  </div>
                  <div className="space-y-2">
                    {groupedByRole[role].map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between gap-2 rounded-md bg-gray-50 p-2"
                      >
                        <div className="flex min-w-0 flex-1 flex-col pl-1">
                          <p className="text-normal truncate text-lg font-medium md:text-xl">
                            {user.name}
                          </p>
                          <p className="text-subtle-dark truncate text-sm md:text-base">
                            {user.email}
                          </p>
                        </div>
                        <div className="flex flex-shrink-0 gap-2">
                          <button
                            onClick={() => handleEditClick(user)}
                            aria-label="แก้ไขบัญชีผู้ใช้งาน"
                            className="text-surface bg-gradient-primary flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {user.id !== currentUserId && (
                            <button
                              onClick={() => handleDeleteClick(user)}
                              aria-label="ลบบัญชีผู้ใช้งาน"
                              className="text-surface bg-destructive flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <div className="flex flex-1 items-center justify-center">
                  <p className="text-subtle-light text-center text-xl text-balance md:text-[22px]">
                    {searchTerm
                      ? `ไม่พบ "${searchTerm}"`
                      : "ไม่มีบัญชีผู้ใช้งาน"}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="ยืนยันการลบบัญชีผู้ใช้งาน"
        itemName={deletingUser?.name || deletingUser?.email || ""}
      />
    </div>
  );
};

export default UserList;
