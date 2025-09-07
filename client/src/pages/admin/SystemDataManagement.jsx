import { useState, useEffect } from "react";
import { ChevronLeft, Plus, Edit, Trash2, Search, RefreshCw } from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import FormButton from "@/components/forms/FormButton";
import FormInput from "@/components/forms/FormInput";
import { useForm } from "react-hook-form";
import api from "@/lib/api";

const SystemDataManagement = () => {
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("categories");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  // ดึงข้อมูลหมวดหมู่
  const fetchCategories = async () => {
    try {
      const response = await api.get("/api/category");
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("ไม่สามารถดึงข้อมูลหมวดหมู่ได้");
    }
  };

  // ดึงข้อมูลบริการ
  const fetchServices = async () => {
    try {
      const response = await api.get("/api/service");
      setServices(response.data);
    } catch (error) {
      console.error("Error fetching services:", error);
      toast.error("ไม่สามารถดึงข้อมูลบริการได้");
    }
  };

  // ดึงข้อมูลทั้งหมด
  const fetchAllData = async () => {
    setIsLoading(true);
    await Promise.all([fetchCategories(), fetchServices()]);
    setIsLoading(false);
  };

  // เพิ่มข้อมูลใหม่
  const handleAddItem = async (data) => {
    try {
      const endpoint = activeTab === "categories" ? "/api/category" : "/api/service";
      await api.post(endpoint, {
        name: data.name,
        description: data.description,
      });
      toast.success(`เพิ่ม${activeTab === "categories" ? "หมวดหมู่" : "บริการ"}สำเร็จ`);
      reset();
      setShowAddForm(false);
      if (activeTab === "categories") {
        fetchCategories();
      } else {
        fetchServices();
      }
    } catch (error) {
      console.error("Error adding item:", error);
      toast.error(`ไม่สามารถเพิ่ม${activeTab === "categories" ? "หมวดหมู่" : "บริการ"}ได้`);
    }
  };

  // แก้ไขข้อมูล
  const handleEditItem = async (data) => {
    try {
      const endpoint = activeTab === "categories" ? "/api/category" : "/api/service";
      await api.put(`${endpoint}/${editingItem.id}`, {
        name: data.name,
        description: data.description,
      });
      toast.success(`แก้ไข${activeTab === "categories" ? "หมวดหมู่" : "บริการ"}สำเร็จ`);
      reset();
      setEditingItem(null);
      setShowAddForm(false);
      if (activeTab === "categories") {
        fetchCategories();
      } else {
        fetchServices();
      }
    } catch (error) {
      console.error("Error editing item:", error);
      toast.error(`ไม่สามารถแก้ไข${activeTab === "categories" ? "หมวดหมู่" : "บริการ"}ได้`);
    }
  };

  // ลบข้อมูล
  const handleDeleteItem = async (id) => {
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบ${activeTab === "categories" ? "หมวดหมู่" : "บริการ"}นี้?`)) return;

    try {
      const endpoint = activeTab === "categories" ? "/api/category" : "/api/service";
      await api.delete(`${endpoint}/${id}`);
      toast.success(`ลบ${activeTab === "categories" ? "หมวดหมู่" : "บริการ"}สำเร็จ`);
      if (activeTab === "categories") {
        fetchCategories();
      } else {
        fetchServices();
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error(`ไม่สามารถลบ${activeTab === "categories" ? "หมวดหมู่" : "บริการ"}ได้`);
    }
  };

  // เริ่มแก้ไข
  const startEdit = (item) => {
    setEditingItem(item);
    reset({
      name: item.name,
      description: item.description,
    });
    setShowAddForm(true);
  };

  // ยกเลิกการแก้ไข
  const cancelEdit = () => {
    setEditingItem(null);
    setShowAddForm(false);
    reset();
  };

  // เปลี่ยนแท็บ
  const changeTab = (tab) => {
    setActiveTab(tab);
    setShowAddForm(false);
    setEditingItem(null);
    reset();
    setSearchTerm("");
  };

  // ข้อมูลที่แสดงผล
  const getCurrentData = () => {
    return activeTab === "categories" ? categories : services;
  };

  // กรองข้อมูลตามการค้นหา
  const filteredData = getCurrentData().filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  useEffect(() => {
    fetchAllData();
  }, []);

  return (
    <div className="w-full h-full bg-gradient-primary shadow-primary">
      <div className="flex items-center gap-[8px] px-[20px] pt-[16px]">
        <Link to="/admin/management" className="mt-[2px] text-surface">
          <ChevronLeft />
        </Link>
        <p className="font-semibold text-[24px] md:text-[26px] text-surface">
          จัดการข้อมูลระบบ
        </p>
      </div>

      <div className="w-full h-full md:min-h-[calc(100vh-68px)] mt-[16px] rounded-tl-2xl rounded-tr-2xl bg-surface shadow-primary">
        <div className="px-[20px] py-[24px]">
          {/* แท็บ */}
          <div className="flex mb-[24px] border-b">
            <button
              onClick={() => changeTab("categories")}
              className={`px-[20px] py-[12px] font-medium transition-colors ${
                activeTab === "categories"
                  ? "text-primary border-b-2 border-primary"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              หมวดหมู่อะไหล่
            </button>
            <button
              onClick={() => changeTab("services")}
              className={`px-[20px] py-[12px] font-medium transition-colors ${
                activeTab === "services"
                  ? "text-primary border-b-2 border-primary"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              ประเภทบริการ
            </button>
          </div>

          {/* ปุ่มเพิ่มและการค้นหา */}
          <div className="flex flex-col md:flex-row gap-[16px] mb-[24px]">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-[8px] px-[16px] py-[12px] bg-primary text-white rounded-[8px] hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
              เพิ่ม{activeTab === "categories" ? "หมวดหมู่" : "บริการ"}ใหม่
            </button>

            <button
              onClick={fetchAllData}
              className="flex items-center gap-[8px] px-[16px] py-[12px] border border-gray-300 text-gray-700 rounded-[8px] hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              รีเฟรช
            </button>

            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={`ค้นหา${activeTab === "categories" ? "หมวดหมู่" : "บริการ"}...`}
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
                {editingItem
                  ? `แก้ไข${activeTab === "categories" ? "หมวดหมู่" : "บริการ"}`
                  : `เพิ่ม${activeTab === "categories" ? "หมวดหมู่" : "บริการ"}ใหม่`}
              </h3>
              
              <form
                onSubmit={handleSubmit(editingItem ? handleEditItem : handleAddItem)}
                className="space-y-[16px]"
              >
                <FormInput
                  register={register}
                  name="name"
                  label={`ชื่อ${activeTab === "categories" ? "หมวดหมู่" : "บริการ"}`}
                  placeholder={`กรอกชื่อ${activeTab === "categories" ? "หมวดหมู่" : "บริการ"}`}
                  errors={errors}
                  rules={{ required: `กรุณากรอกชื่อ${activeTab === "categories" ? "หมวดหมู่" : "บริการ"}` }}
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    คำอธิบาย (ไม่บังคับ)
                  </label>
                  <textarea
                    {...register("description")}
                    rows={3}
                    placeholder={`กรอกคำอธิบาย${activeTab === "categories" ? "หมวดหมู่" : "บริการ"}`}
                    className="w-full px-3 py-3 border border-gray-300 rounded-[8px] focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                  />
                </div>
                
                <div className="flex gap-[12px]">
                  <FormButton
                    label={editingItem ? "บันทึกการแก้ไข" : `เพิ่ม${activeTab === "categories" ? "หมวดหมู่" : "บริการ"}`}
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

          {/* รายการข้อมูล */}
          {isLoading ? (
            <div className="text-center py-[40px]">
              <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
            </div>
          ) : (
            <div className="grid gap-[16px] md:grid-cols-2 lg:grid-cols-3">
              {filteredData.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-[20px] rounded-[12px] border hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-[12px]">
                    <h4 className="font-semibold text-[18px] text-gray-900 flex-1">
                      {item.name}
                    </h4>
                    <div className="flex gap-[8px] ml-[12px]">
                      <button
                        onClick={() => startEdit(item)}
                        className="p-[6px] text-blue-600 hover:bg-blue-100 rounded-[4px] transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-[6px] text-red-600 hover:bg-red-100 rounded-[4px] transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {item.description && (
                    <p className="text-gray-600 text-[14px] mb-[12px]">
                      {item.description}
                    </p>
                  )}
                  
                  <div className="text-xs text-gray-400">
                    ID: {item.id}
                  </div>
                </div>
              ))}
              
              {filteredData.length === 0 && (
                <div className="col-span-full text-center py-[40px]">
                  <p className="text-gray-500">
                    ไม่พบข้อมูล{activeTab === "categories" ? "หมวดหมู่" : "บริการ"}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* สถิติ */}
          <div className="mt-[32px] grid md:grid-cols-2 gap-[16px]">
            <div className="bg-blue-50 p-[20px] rounded-[12px] border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-[8px]">
                จำนวนหมวดหมู่อะไหล่
              </h4>
              <p className="text-2xl font-bold text-blue-700">{categories.length}</p>
            </div>
            
            <div className="bg-green-50 p-[20px] rounded-[12px] border border-green-200">
              <h4 className="font-semibold text-green-900 mb-[8px]">
                จำนวนประเภทบริการ
              </h4>
              <p className="text-2xl font-bold text-green-700">{services.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemDataManagement;
