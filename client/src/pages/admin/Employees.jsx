import { useState, useEffect } from "react";
import { ChevronLeft, Edit, Trash2, LoaderCircle } from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import FormButton from "@/components/forms/FormButton";
import SearchBar from "@/components/forms/SearchBar";
import EmployeeFormDialog from "@/components/dialogs/EmployeeFormDialog";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";
import { getEmployees, deleteEmployee } from "@/api/employee";

const Employees = () => {
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
      console.error(error);
      toast.error(error.response?.data?.message);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
    setDeletingEmployee(null);
  };

  const startEdit = (employee) => {
    setEditingEmployee(employee);
    setShowAddForm(true);
  };

  // กรองพนักงานตามคำค้นหา
  const filteredEmployees = employees.filter(
    (employee) =>
      employee.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // จัดกลุ่มพนักงานตามบทบาท
  const groupedByRole = {};
  filteredEmployees.forEach((employee) => {
    if (!groupedByRole[employee.role]) {
      groupedByRole[employee.role] = [];
    }
    groupedByRole[employee.role].push(employee);
  });

  // เรียงลำดับพนักงานภายในแต่ละกลุ่มบทบาทตาม ID
  Object.keys(groupedByRole).forEach((role) => {
    groupedByRole[role].sort((a, b) => a.id - b.id);
  });

  // เรียงลำดับกลุ่มบทบาท (ADMIN มาก่อน)
  const sortedRoles = Object.keys(groupedByRole).sort((a, b) => {
    if (a === "ADMIN") return -1;
    if (b === "ADMIN") return 1;
    return 0;
  });

  // แปลงบทบาทเป็นข้อความแสดงผล
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
          จัดการบัญชีพนักงาน
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
              label="+ เพิ่มบัญชีพนักงาน"
              onClick={() => {
                setEditingEmployee(null);
                setShowAddForm(true);
              }}
              className="bg-gradient-primary my-[16px] ml-0"
            />

            {/* ฟอร์มเพิ่ม/แก้ไขพนักงาน */}
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
                  className="bg-surface shadow-primary rounded-[10px] p-[16px]"
                >
                  <div className="mb-[16px] flex items-center gap-[8px] border-b border-gray-100 pb-[16px]">
                    <p className="text-primary text-[20px] font-semibold md:text-[22px]">
                      {getRoleLabel(role)}
                    </p>
                  </div>

                  {/* รายการพนักงานในกลุ่มบทบาท */}
                  <div className="space-y-[8px]">
                    {groupedByRole[role].map((employee) => (
                      <div
                        key={employee.id}
                        className="flex items-center justify-between gap-[8px] rounded-[8px] bg-gray-50 p-[8px]"
                      >
                        <div className="flex min-w-0 flex-1 flex-col">
                          <p className="text-normal truncate text-[18px] font-medium md:text-[20px]">
                            {employee.fullName}
                          </p>
                          <p className="text-subtle-dark truncate text-[14px] md:text-[16px]">
                            {employee.email}
                          </p>
                        </div>
                        <div className="flex flex-shrink-0 gap-[8px]">
                          <button
                            onClick={() => startEdit(employee)}
                            className="text-surface bg-gradient-primary flex cursor-pointer items-center gap-[4px] rounded-[10px] px-[12px] py-[6px] text-[14px] font-medium"
                          >
                            <Edit className="h-[14px] w-[14px]" />
                            <p className="font-semibold">แก้ไข</p>
                          </button>
                          <button
                            onClick={() => confirmDelete(employee)}
                            className="text-surface bg-delete flex cursor-pointer items-center gap-[4px] rounded-[10px] px-[12px] py-[6px] text-[14px] font-medium"
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

              {filteredEmployees.length === 0 && (
                <div className="py-[24px] text-center">
                  <p className="text-subtle-light">ไม่พบข้อมูลพนักงาน</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="ยืนยันการลบ"
        message="ต้องการลบพนักงานนี้หรือไม่?"
        itemName={deletingEmployee?.fullName || deletingEmployee?.email || ""}
      />
    </div>
  );
};

export default Employees;
