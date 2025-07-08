import React, { useState } from 'react';
import { Check } from 'lucide-react';

const CheckSuspension = () => {
  const [formData, setFormData] = useState({
    customerName: '',
    brand: '',
    model: '',
    licensePlate: ''
  });

  const [repairItems] = useState([
    { id: 1, name: 'ลูกหมากบิ๊กแบบบน', price: 500, image: '/api/placeholder/60/60', selected: true },
    { id: 2, name: 'ลูกหมากบิ๊กแบบล่าง', price: 0, image: '/api/placeholder/60/60', selected: true },
    { id: 3, name: 'ลูกหมากคันชัก', price: 0, image: '/api/placeholder/60/60', selected: true },
    { id: 4, name: 'ลูกหมากแร็ค', price: 0, image: '/api/placeholder/60/60', selected: true },
    { id: 5, name: 'ลูกหมากก้มโค้ง', price: 0, image: '/api/placeholder/60/60', selected: true }
  ]);

  const [activeTab, setActiveTab] = useState('repair');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const totalPrice = repairItems.reduce((sum, item) => sum + (item.selected ? item.price : 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile/Desktop Layout */}
      <div className="max-w-md mx-auto bg-white min-h-screen lg:max-w-4xl lg:p-6">
        
        {/* Header Section - Purple Background */}
        <div className="bg-gradient-to-br from-primary to-[#8663f8] p-6 lg:rounded-t-xl">
          <h1 className="text-white text-xl font-semibold mb-6 lg:text-2xl">เช็คช่วงล่าง</h1>
          
          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="text-white text-sm font-medium mb-2 block">ชื่อลูกค้า</label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => handleInputChange('customerName', e.target.value)}
                className="w-full px-4 py-3 rounded-full border-0 focus:ring-2 focus:ring-white/50 text-gray-800 placeholder-gray-400"
                placeholder="กรอกชื่อลูกค้า"
              />
            </div>
            
            <div>
              <label className="text-white text-sm font-medium mb-2 block">ยี่ห้อ</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => handleInputChange('brand', e.target.value)}
                className="w-full px-4 py-3 rounded-full border-0 focus:ring-2 focus:ring-white/50 text-gray-800 placeholder-gray-400"
                placeholder="กรอกยี่ห้อรถ"
              />
            </div>
            
            <div>
              <label className="text-white text-sm font-medium mb-2 block">รุ่น</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => handleInputChange('model', e.target.value)}
                className="w-full px-4 py-3 rounded-full border-0 focus:ring-2 focus:ring-white/50 text-gray-800 placeholder-gray-400"
                placeholder="กรอกรุ่นรถ"
              />
            </div>
            
            <div>
              <label className="text-white text-sm font-medium mb-2 block">ทะเบียนรถ</label>
              <input
                type="text"
                value={formData.licensePlate}
                onChange={(e) => handleInputChange('licensePlate', e.target.value)}
                className="w-full px-4 py-3 rounded-full border-0 focus:ring-2 focus:ring-white/50 text-gray-800 placeholder-gray-400"
                placeholder="กรอกทะเบียนรถ"
              />
            </div>
          </div>
        </div>

        {/* Content Section - White Background */}
        <div className="bg-white rounded-t-3xl -mt-6 pt-6 px-6 pb-6 relative z-10 lg:rounded-b-xl lg:mt-0 lg:rounded-t-none">
          
          {/* Tab Navigation */}
          <div className="flex mb-6">
            <button
              onClick={() => setActiveTab('repair')}
              className={`flex-1 py-3 px-4 text-center font-medium rounded-l-lg transition-colors duration-200 ${
                activeTab === 'repair'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              ซ่าย
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-3 px-4 text-center font-medium rounded-r-lg transition-colors duration-200 ${
                activeTab === 'history'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              ขวา
            </button>
          </div>

          {/* Repair Items List */}
          <div className="space-y-3 mb-6">
            {repairItems.map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                  item.selected
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    item.selected ? 'bg-primary' : 'bg-gray-300'
                  }`}>
                    {item.selected && <Check className="w-5 h-5 text-white" />}
                  </div>
                  
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="w-8 h-8 bg-gray-300 rounded"></div>
                  </div>
                  
                  <span className="font-medium text-gray-800 flex-1">{item.name}</span>
                </div>
                
                <span className="font-semibold text-lg text-gray-800">
                  {item.price} บาท
                </span>
              </div>
            ))}
          </div>

          {/* Total and Submit */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold text-gray-800">รวม 1 รายการ</span>
              <span className="text-xl font-bold text-primary">{totalPrice} บาท</span>
            </div>
            
            <button className="w-full bg-gradient-to-r from-primary to-[#8663f8] text-white py-4 rounded-full font-semibold text-lg hover:opacity-90 hover:scale-[1.02] transition-all duration-200 shadow-lg">
              ถัดไป
            </button>
          </div>
        </div>
      </div>

      {/* Floating Action Button - Z icon (for mobile) */}
      <div className="fixed bottom-6 right-6 lg:hidden">
        <button className="w-14 h-14 bg-pink-500 text-white rounded-full flex items-center justify-center text-xl font-bold shadow-lg hover:scale-110 transition-transform duration-200">
          Z
        </button>
      </div>
    </div>
  );
};

export default CheckSuspension;
