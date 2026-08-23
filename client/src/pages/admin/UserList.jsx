import { useState, useEffect } from "react";
import { ChevronLeft, Edit, Trash2, LoaderCircle } from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import FormButton from "@/components/forms/FormButton";
import SearchBar from "@/components/forms/SearchBar";
import UserFormDialog from "@/components/dialogs/UserFormDialog";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import { listUsers, deleteUser } from "@/api/user";
import { toastError } from "@/utils/handleError";

const UserList = () => {
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

  const getRoleLabel = (role) => {
    switch (role) {
      case "ADMIN":
        return "แอดมิน";
      case "EMPLOYEE":
        return "พนักงาน";
      default:
        return role;
    }
  };

  return (
    <div className="bg-gradient-primary shadow-primary flex min-h-svh w-full flex-col">
      <div className="flex items-center gap-[8px] px-[20px] pt-[16px]">
        <Link
          to="/dashboard"
          aria-label="ย้อนกลับ"
          className="bg-surface/20 flex h-[40px] w-[40px] shrink-0 cursor-pointer items-center justify-center rounded-full"
        >
          <ChevronLeft className="text-surface" />
        </Link>
        <p className="text-surface text-2xl font-semibold md:text-[26px]">
          จัดการบัญชีผู้ใช้งาน
        </p>
      </div>
      <div className="bg-surface shadow-primary mt-[16px] flex w-full flex-1 flex-col rounded-tl-2xl rounded-tr-2xl pb-[112px] xl:pb-[16px]">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <LoaderCircle className="text-primary h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="flex flex-1 flex-col px-[20px] pt-[16px]">
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
              className="bg-gradient-primary my-[16px] ml-0"
            />

            <UserFormDialog
              isOpen={isFormDialogOpen}
              onClose={() => {
                setIsFormDialogOpen(false);
                setEditingUser(null);
              }}
              editingItem={editingUser}
              onSuccess={fetchUsers}
            />

            <div className="flex flex-1 flex-col gap-[16px]">
              {sortedRoles.map((role) => (
                <div
                  key={role}
                  className="bg-surface shadow-primary rounded-[10px] p-[16px]"
                >
                  <div className="mb-[16px] flex items-center gap-[8px] border-b border-gray-100 pb-[16px]">
                    <p className="text-primary text-xl font-semibold md:text-[22px]">
                      {getRoleLabel(role)}
                    </p>
                  </div>
                  <div className="space-y-[8px]">
                    {groupedByRole[role].map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between gap-[8px] rounded-[8px] bg-gray-50 p-[8px]"
                      >
                        <div className="flex min-w-0 flex-1 flex-col">
                          <p className="text-normal truncate text-lg font-medium md:text-xl">
                            {user.name}
                          </p>
                          <p className="text-subtle-dark truncate text-sm md:text-base">
                            {user.email}
                          </p>
                        </div>
                        <div className="flex flex-shrink-0 gap-[8px]">
                          <button
                            onClick={() => handleEditClick(user)}
                            aria-label="แก้ไขบัญชีผู้ใช้งาน"
                            className="text-surface bg-gradient-primary flex h-[36px] w-[36px] shrink-0 cursor-pointer items-center justify-center rounded-[10px]"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(user)}
                            aria-label="ลบบัญชีผู้ใช้งาน"
                            className="text-surface bg-destructive flex h-[36px] w-[36px] shrink-0 cursor-pointer items-center justify-center rounded-[10px]"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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
