import { useState, useEffect } from "react";
import { ChevronLeft, Edit, Trash2, LoaderCircle } from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import FormButton from "@/components/forms/FormButton";
import SearchBar from "@/components/forms/SearchBar";
import UserFormDialog from "@/components/dialogs/UserFormDialog";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import { getUsers, deleteUser } from "@/api/user";

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
      const res = await getUsers();
      setUsers(res.data);
    } catch (error) {
      console.log(error);
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
      toast.success("ลบบัญชีผู้ใช้งานสำเร็จ");
      setIsDeleteDialogOpen(false);
      setDeletingUser(null);
      fetchUsers();
    } catch (error) {
      console.log(error);
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
      user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
    <div className="bg-gradient-primary shadow-primary h-[87px] w-full">
      <div className="flex items-center gap-[8px] px-[20px] pt-[16px]">
        <Link to="/dashboard" className="text-surface mt-[2px]">
          <ChevronLeft />
        </Link>
        <p className="text-surface text-[24px] font-semibold md:text-[26px]">
          จัดการบัญชีผู้ใช้งาน
        </p>
      </div>
      <div className="bg-surface shadow-primary mt-[16px] min-h-[calc(100vh-65px)] w-full rounded-tl-2xl rounded-tr-2xl pb-[112px] xl:pb-[16px]">
        {isLoading ? (
          <div className="flex h-[502px] items-center justify-center">
            <LoaderCircle className="text-primary h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="px-[20px] py-[16px] pb-[112px]">
            <div className="w-full">
              <SearchBar
                placeholder="ค้นหาชื่อ-นามสกุล, อีเมล"
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

            <div className="space-y-[16px]">
              {sortedRoles.map((role) => (
                <div
                  key={role}
                  className="bg-surface shadow-primary rounded-[10px] p-[16px]"
                >
                  <div className="mb-[16px] flex items-center gap-[8px] border-b border-gray-100 pb-[16px]">
                    <p className="text-primary text-[20px] font-semibold md:text-[22px]">
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
                          <p className="text-normal truncate text-[18px] font-medium md:text-[20px]">
                            {user.fullName}
                          </p>
                          <p className="text-subtle-dark truncate text-[14px] md:text-[16px]">
                            {user.email}
                          </p>
                        </div>
                        <div className="flex flex-shrink-0 gap-[8px]">
                          <button
                            onClick={() => handleEditClick(user)}
                            className="text-surface bg-gradient-primary flex cursor-pointer items-center gap-[4px] rounded-[10px] px-[12px] py-[6px] text-[14px] font-medium"
                          >
                            <Edit className="h-[14px] w-[14px]" />
                            <p className="font-semibold">แก้ไข</p>
                          </button>
                          <button
                            onClick={() => handleDeleteClick(user)}
                            className="text-surface bg-destructive flex cursor-pointer items-center gap-[4px] rounded-[10px] px-[12px] py-[6px] text-[14px] font-medium"
                          >
                            <Trash2 className="h-[14px] w-[14px]" />
                            <p className="font-semibold">ลบ</p>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <div className="py-[24px] text-center">
                  <p className="text-subtle-light">ไม่พบข้อมูลบัญชีผู้ใช้งาน</p>
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
        title="ยืนยันการลบ"
        message="ต้องการลบบัญชีผู้ใช้งานนี้หรือไม่?"
        itemName={deletingUser?.fullName || deletingUser?.email || ""}
      />
    </div>
  );
};

export default UserList;
