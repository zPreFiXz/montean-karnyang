import { useState, useEffect } from "react";
import {
  ChevronLeft,
  Plus,
  Edit,
  Trash2,
  Search,
  Eye,
  EyeOff,
} from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import FormButton from "@/components/forms/FormButton";
import FormInput from "@/components/forms/FormInput";
import { useForm } from "react-hook-form";
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "@/api/employee";

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const watchRole = watch("role");

  useEffect(() => {
    fetchEmployees();
  }, []);

  // ดึงข้อมูลพนักงาน
  const fetchEmployees = async () => {
    try {
      const response = await getEmployees();
      setEmployees(response.data.data);
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("ไม่สามารถดึงข้อมูลพนักงานได้");
    } finally {
      setIsLoading(false);
    }
  };

  // เพิ่มพนักงานใหม่
  const handleAddEmployee = async (data) => {
    try {
      await createEmployee({
        email: data.email,
        password: data.password,
        fullName: `${data.firstName} ${data.lastName}`,
        nickname: data.username,
        role: data.role,
        phoneNumber: data.phoneNumber,
        dateOfBirth: data.dateOfBirth || "1990-01-01", // Default date if not provided
      });
      toast.success("เพิ่มพนักงานสำเร็จ");
      reset();
      setShowAddForm(false);
      fetchEmployees();
    } catch (error) {
      console.error("Error adding employee:", error);
      toast.error(error.response?.data?.message || "ไม่สามารถเพิ่มพนักงานได้");
    }
  };

  // แก้ไขพนักงาน
  const handleEditEmployee = async (data) => {
    try {
      const updateData = {
        email: data.email,
        fullName: `${data.firstName} ${data.lastName}`,
        nickname: data.username,
        role: data.role,
        phoneNumber: data.phoneNumber,
        dateOfBirth: data.dateOfBirth,
      };

      // เพิ่มรหัสผ่านใหม่ถ้ามีการกรอก
      if (data.password && data.password.trim() !== "") {
        updateData.password = data.password;
      }

      await updateEmployee(editingEmployee.id, updateData);
      toast.success("แก้ไขข้อมูลพนักงานสำเร็จ");
      reset();
      setEditingEmployee(null);
      setShowAddForm(false);
      fetchEmployees();
    } catch (error) {
      console.error("Error editing employee:", error);
      toast.error(
        error.response?.data?.message || "ไม่สามารถแก้ไขข้อมูลพนักงานได้"
      );
    }
  };

  // ลบพนักงาน
  const handleDeleteEmployee = async (id) => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบพนักงานคนนี้?")) return;

    try {
      await deleteEmployee(id);
      toast.success("ลบพนักงานสำเร็จ");
      fetchEmployees();
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast.error("ไม่สามารถลบพนักงานได้");
    }
  };

  // เริ่มแก้ไข
  const startEdit = (employee) => {
    setEditingEmployee(employee);
    // Parse fullName back to firstName and lastName for form
    const nameParts = employee.fullName?.split(" ") || ["", ""];
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    reset({
      username: employee.nickname,
      email: employee.email,
      role: employee.role,
      firstName: firstName,
      lastName: lastName,
      phoneNumber: employee.phoneNumber,
      dateOfBirth: employee.dateOfBirth?.split("T")[0] || "", // Format date for input
    });
    setShowAddForm(true);
  };

  // ยกเลิกการแก้ไข
  const cancelEdit = () => {
    setEditingEmployee(null);
    setShowAddForm(false);
    reset();
  };

  // กรองข้อมูลตามการค้นหา
  const filteredEmployees = employees.filter(
    (employee) =>
      employee.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // แปลงตำแหน่งงาน
  const getRoleLabel = (role) => {
    switch (role) {
      case "ADMIN":
        return "ผู้ดูแลระบบ";
      case "MANAGER":
        return "ผู้จัดการ";
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
    <div className="w-full h-full bg-gradient-primary shadow-primary">
      <div className="flex items-center gap-[8px] px-[20px] pt-[16px]">
        <Link to="/admin/management" className="mt-[2px] text-surface">
          <ChevronLeft />
        </Link>
        <p className="font-semibold text-[24px] md:text-[26px] text-surface">
          จัดการพนักงาน
        </p>
      </div>

      <div className="w-full h-full md:min-h-[calc(100vh-68px)] mt-[16px] rounded-tl-2xl rounded-tr-2xl bg-surface shadow-primary">
        <div className="px-[20px] py-[24px]">
          {/* ปุ่มเพิ่มและการค้นหา */}
          <div className="flex flex-col md:flex-row gap-[16px] mb-[24px]">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-[8px] px-[16px] py-[12px] bg-primary text-white rounded-[8px] hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
              เพิ่มพนักงานใหม่
            </button>

            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อ, นามสกุล, ชื่อผู้ใช้..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-[8px] focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          {/* ฟอร์มเพิ่ม/แก้ไข */}
          {showAddForm && (
            <div className="mb-[24px] p-[20px] bg-gray-50 rounded-[12px] border">
              <h3 className="font-semibold text-[18px] mb-[16px]">
                {editingEmployee ? "แก้ไขข้อมูลพนักงาน" : "เพิ่มพนักงานใหม่"}
              </h3>

              <form
                onSubmit={handleSubmit(
                  editingEmployee ? handleEditEmployee : handleAddEmployee
                )}
                className="space-y-[16px]"
              >
                <div className="grid md:grid-cols-2 gap-[16px]">
                  <FormInput
                    register={register}
                    name="firstName"
                    label="ชื่อ"
                    placeholder="กรอกชื่อ"
                    errors={errors}
                    rules={{ required: "กรุณากรอกชื่อ" }}
                  />
                  <FormInput
                    register={register}
                    name="lastName"
                    label="นามสกุล"
                    placeholder="กรอกนามสกุล"
                    errors={errors}
                    rules={{ required: "กรุณากรอกนามสกุล" }}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-[16px]">
                  <FormInput
                    register={register}
                    name="username"
                    label="ชื่อผู้ใช้"
                    placeholder="กรอกชื่อผู้ใช้"
                    errors={errors}
                    rules={{ required: "กรุณากรอกชื่อผู้ใช้" }}
                  />
                  <FormInput
                    register={register}
                    name="email"
                    label="อีเมล"
                    type="email"
                    placeholder="กรอกอีเมล"
                    errors={errors}
                    rules={{
                      required: "กรุณากรอกอีเมล",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "รูปแบบอีเมลไม่ถูกต้อง",
                      },
                    }}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-[16px]">
                  <div className="relative">
                    <FormInput
                      register={register}
                      name="password"
                      label={
                        editingEmployee
                          ? "รหัสผ่านใหม่ (เว้นว่างไว้หากไม่ต้องการเปลี่ยน)"
                          : "รหัสผ่าน"
                      }
                      type={showPassword ? "text" : "password"}
                      placeholder="กรอกรหัสผ่าน"
                      errors={errors}
                      rules={
                        editingEmployee
                          ? {
                              minLength: {
                                value: 6,
                                message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร",
                              },
                            }
                          : {
                              required: "กรุณากรอกรหัสผ่าน",
                              minLength: {
                                value: 6,
                                message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร",
                              },
                            }
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  <FormInput
                    register={register}
                    name="dateOfBirth"
                    label="วันเกิด"
                    type="date"
                    errors={errors}
                    rules={{ required: "กรุณาเลือกวันเกิด" }}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-[16px]">
                  <FormInput
                    register={register}
                    name="phoneNumber"
                    label="เบอร์โทรศัพท์"
                    placeholder="กรอกเบอร์โทรศัพท์"
                    errors={errors}
                    rules={{
                      required: "กรุณากรอกเบอร์โทรศัพท์",
                      pattern: {
                        value: /^[0-9]{10}$/,
                        message: "เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก",
                      },
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ตำแหน่งงาน
                  </label>
                  <select
                    {...register("role", { required: "กรุณาเลือกตำแหน่งงาน" })}
                    className="w-full px-3 py-3 border border-gray-300 rounded-[8px] focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    <option value="">เลือกตำแหน่งงาน</option>
                    <option value="EMPLOYEE">พนักงาน</option>
                    <option value="MANAGER">ผู้จัดการ</option>
                    <option value="ADMIN">ผู้ดูแลระบบ</option>
                  </select>
                  {errors.role && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.role.message}
                    </p>
                  )}
                </div>

                <div className="flex gap-[12px]">
                  <FormButton
                    label={editingEmployee ? "บันทึก" : "เพิ่มพนักงาน"}
                    isLoading={isSubmitting}
                    type="submit"
                  />
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-[16px] py-[12px] border border-gray-300 text-gray-700 rounded-[8px] hover:bg-gray-50 transition-colors"
                  >
                    ยกเลิก
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* รายการพนักงาน */}
          {isLoading ? (
            <div className="text-center py-[40px]">
              <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-[12px] border overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ชื่อ-นามสกุล
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ชื่อผู้ใช้
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      อีเมล
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      เบอร์โทร
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ตำแหน่ง
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      การจัดการ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {employee.fullName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {employee.nickname}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {employee.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {employee.phoneNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(
                            employee.role
                          )}`}
                        >
                          {getRoleLabel(employee.role)}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-[8px]">
                          <button
                            onClick={() => startEdit(employee)}
                            className="p-[6px] text-blue-600 hover:bg-blue-100 rounded-[4px] transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEmployee(employee.id)}
                            className="p-[6px] text-red-600 hover:bg-red-100 rounded-[4px] transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredEmployees.length === 0 && (
                <div className="text-center py-[40px]">
                  <p className="text-gray-500">ไม่พบข้อมูลพนักงาน</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeManagement;
