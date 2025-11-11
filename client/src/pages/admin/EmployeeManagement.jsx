import { useState, useEffect } from "react";
import { ChevronLeft, Edit, Trash2, LoaderCircle } from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import FormButton from "@/components/forms/FormButton";
import SearchBar from "@/components/forms/SearchBar";
import EmployeeFormDialog from "@/components/dialogs/EmployeeFormDialog";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";
import { getEmployees, deleteEmployee } from "@/api/employee";

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingEmployee, setDeletingEmployee] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchEmployees();
  }, []);

  // ดึงข้อมูลพนักงาน
  const fetchEmployees = async () => {
    try {
      const response = await getEmployees();
      setEmployees(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // ฟอร์มย้ายไปที่ EmployeeFormDialog

  // ลบพนักงานด้วย DeleteConfirmDialog
  const confirmDelete = (employee) => {
    setDeletingEmployee(employee);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingEmployee) return;
    try {
      await deleteEmployee(deletingEmployee.id);
      toast.success("ลบพนักงานสำเร็จ");
      setShowDeleteDialog(false);
      setDeletingEmployee(null);
      fetchEmployees();
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast.error(error.response?.data?.message);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
    setDeletingEmployee(null);
  };

  // เริ่มแก้ไข
  const startEdit = (employee) => {
    setEditingEmployee(employee);
    setShowAddForm(true);
  };

  // กรองข้อมูลตามการค้นหา
  const filteredEmployees = employees.filter(
    (employee) =>
      employee.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // จัดกลุ่มตามตำแหน่ง
  const groupedByRole = {};
  filteredEmployees.forEach((employee) => {
    if (!groupedByRole[employee.role]) {
      groupedByRole[employee.role] = [];
    }
    groupedByRole[employee.role].push(employee);
  });

  // เรียงลำดับตาม id ภายในแต่ละกลุ่ม
  Object.keys(groupedByRole).forEach((role) => {
    groupedByRole[role].sort((a, b) => a.id - b.id);
  });

  // เรียงลำดับกลุ่มให้แอดมินแสดงก่อน
  const sortedRoles = Object.keys(groupedByRole).sort((a, b) => {
    if (a === "ADMIN") return -1;
    if (b === "ADMIN") return 1;
    return 0;
  });

  // แปลงตำแหน่งงาน
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

  const getRoleColor = (role) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-800";
      case "MANAGER":
        return "bg-blue-100 text-blue-800";
      case "EMPLOYEE":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="w-full h-[84px] bg-gradient-primary shadow-primary">
      <div className="flex items-center gap-[8px] px-[20px] pt-[16px]">
        <Link to="/admin/management" className="mt-[2px] text-surface">
          <ChevronLeft />
        </Link>
        <p className="font-semibold text-[24px] md:text-[26px] text-surface">
          จัดการบัญชีพนักงาน
        </p>
      </div>

      <div className="w-full h-[calc(100vh-68px)] mt-[16px] rounded-tl-2xl rounded-tr-2xl bg-surface shadow-primary">
        {isLoading ? (
          <div className="flex justify-center items-center h-[502px]">
            <LoaderCircle className="w-8 h-8 animate-spin text-primary" />
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
              label="+ เพิ่มบัญชีพนักงาน"
              onClick={() => {
                setEditingEmployee(null);
                setShowAddForm(true);
              }}
              className="my-[16px] ml-0 bg-gradient-primary"
            />

            {/* ฟอร์มเพิ่ม/แก้ไข */}
            <EmployeeFormDialog
              isOpen={showAddForm}
              onClose={() => {
                setShowAddForm(false);
                setEditingEmployee(null);
              }}
              editingItem={editingEmployee}
              onSuccess={fetchEmployees}
            />

            <div className="space-y-[16px]">
              {sortedRoles.map((role) => (
                <div
                  key={role}
                  className="p-[16px] rounded-[10px] bg-surface shadow-primary"
                >
                  <div className="flex items-center gap-[8px] pb-[16px] mb-[16px] border-b border-gray-100">
                    <p className="font-semibold text-[20px] md:text-[22px] text-primary">
                      {getRoleLabel(role)}
                    </p>
                  </div>

                  {/* รายการพนักงาน */}
                  <div className="space-y-[8px]">
                    {groupedByRole[role].map((employee) => (
                      <div
                        key={employee.id}
                        className="flex items-center justify-between gap-[8px] p-[8px] rounded-[8px] bg-gray-50"
                      >
                        <div className="flex flex-col flex-1 min-w-0">
                          <p className="font-medium text-[18px] md:text-[20px] text-normal truncate">
                            {employee.fullName}
                          </p>
                          <p className="text-[14px] md:text-[16px] text-subtle-dark truncate">
                            {employee.email}
                          </p>
                        </div>
                        <div className="flex gap-[8px] flex-shrink-0">
                          <button
                            onClick={() => startEdit(employee)}
                            className="flex items-center gap-[4px] px-[12px] py-[6px] rounded-[10px] font-medium text-[14px] text-surface bg-gradient-primary cursor-pointer"
                          >
                            <Edit className="w-[14px] h-[14px]" />
                            <p className="font-semibold">แก้ไข</p>
                          </button>
                          <button
                            onClick={() => confirmDelete(employee)}
                            className="flex items-center gap-[4px] px-[12px] py-[6px] rounded-[10px] font-medium text-[14px] text-surface bg-delete cursor-pointer"
                          >
                            <Trash2 className="w-[14px] h-[14px]" />
                            <p className="font-semibold">ลบ</p>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {filteredEmployees.length === 0 && (
                <div className="text-center py-[24px]">
                  <p className="text-subtle-light">ไม่พบข้อมูลพนักงาน</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="ยืนยันการลบพนักงาน"
        message="คุณแน่ใจหรือไม่ว่าต้องการลบพนักงานนี้?"
        itemName={deletingEmployee?.fullName || deletingEmployee?.email || ""}
      />
    </div>
  );
};

export default EmployeeManagement;
