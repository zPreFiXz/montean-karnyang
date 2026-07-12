import { useState, useEffect } from "react";
import { ChevronLeft, Edit, Trash2, LoaderCircle } from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import FormButton from "@/components/forms/FormButton";
import SearchBar from "@/components/forms/SearchBar";
import EmployeeFormDialog from "@/components/dialogs/EmployeeFormDialog";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import { listEmployees, deleteEmployee } from "@/api/employee";
import { toastError } from "@/utils/handleError";

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingEmployee, setDeletingEmployee] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const res = await listEmployees();
      setEmployees(res.data);
    } catch (error) {
      toastError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (employee) => {
    setDeletingEmployee(employee);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingEmployee) return;
    try {
      await deleteEmployee(deletingEmployee.id);
      toast.success("ลบพนักงานสำเร็จ");
      setIsDeleteDialogOpen(false);
      setDeletingEmployee(null);
      fetchEmployees();
    } catch (error) {
      toastError(error);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setDeletingEmployee(null);
  };

  const handleEditClick = (employee) => {
    setEditingEmployee(employee);
    setIsFormDialogOpen(true);
  };

  const filteredEmployees = employees.filter(
    (employee) =>
      employee.zkUserId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const sortedEmployees = [...filteredEmployees].sort((a, b) => a.id - b.id);

  return (
    <div className="bg-gradient-primary shadow-primary h-[87px] w-full">
      <div className="flex items-center gap-[8px] px-[20px] pt-[16px]">
        <Link to="/dashboard" className="text-surface mt-[2px]">
          <ChevronLeft />
        </Link>
        <p className="text-surface text-2xl font-semibold md:text-[26px]">
          จัดการพนักงาน
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
                placeholder="ค้นหารหัสพนักงาน, ชื่อ หรือเบอร์โทร"
                value={searchTerm}
                onSearch={setSearchTerm}
              />
            </div>

            <FormButton
              label="+ เพิ่มพนักงาน"
              onClick={() => {
                setEditingEmployee(null);
                setIsFormDialogOpen(true);
              }}
              className="bg-gradient-primary my-[16px] ml-0"
            />

            <EmployeeFormDialog
              isOpen={isFormDialogOpen}
              onClose={() => {
                setIsFormDialogOpen(false);
                setEditingEmployee(null);
              }}
              editingItem={editingEmployee}
              onSuccess={fetchEmployees}
            />

            <div className="space-y-[16px]">
              <div className="bg-surface shadow-primary rounded-[10px] p-[16px]">
                <div className="mb-[16px] flex items-center gap-[8px] border-b border-gray-100 pb-[16px]">
                  <p className="text-primary text-xl font-semibold md:text-[22px]">
                    รายชื่อพนักงาน
                  </p>
                </div>
                <div className="space-y-[8px]">
                  {sortedEmployees.map((employee) => (
                    <div
                      key={employee.id}
                      className="flex items-center justify-between gap-[8px] rounded-[8px] bg-gray-50 p-[8px]"
                    >
                      <div className="flex min-w-0 flex-1 flex-col">
                        <p className="text-normal truncate text-lg font-medium md:text-xl">
                          {employee.name}
                        </p>
                        <p className="text-subtle-dark truncate text-sm md:text-base">
                          รหัสเครื่องสแกน: {employee.zkUserId}
                        </p>
                      </div>
                      <div className="flex flex-shrink-0 gap-[8px]">
                        <button
                          onClick={() => handleEditClick(employee)}
                          className="text-surface bg-gradient-primary flex cursor-pointer items-center gap-[4px] rounded-[10px] px-[12px] py-[6px] text-sm font-medium"
                        >
                          <Edit className="h-[14px] w-[14px]" />
                          <p className="font-semibold">แก้ไข</p>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(employee)}
                          className="text-surface bg-destructive flex cursor-pointer items-center gap-[4px] rounded-[10px] px-[12px] py-[6px] text-sm font-medium"
                        >
                          <Trash2 className="h-[14px] w-[14px]" />
                          <p className="font-semibold">ลบ</p>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {filteredEmployees.length === 0 && (
                <div className="py-[24px] text-center">
                  <p className="text-subtle-light">ไม่พบข้อมูลพนักงาน</p>
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
        message="ต้องการลบพนักงานนี้หรือไม่?"
        itemName={deletingEmployee?.name || ""}
      />
    </div>
  );
};

export default EmployeeList;
