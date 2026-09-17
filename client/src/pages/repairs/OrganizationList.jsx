import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ChevronLeft, LoaderCircle, Store } from "lucide-react";
import SearchBar from "@/components/forms/SearchBar";
import CarCard from "@/components/cards/CarCard";
import { listOrganizations } from "@/api/customer";
import { organizationLabel } from "@/constants/organizations";
import { toastError } from "@/utils/handleError";
import {
  useScrollRestoration,
  useScrollTracking,
} from "@/utils/scrollPosition";

const SCROLL_KEY = "organizations";

// จำผลไว้ กดย้อนกลับมาจะได้มีรายการโชว์ตั้งแต่เฟรมแรก ไม่ต้องขึ้นตัวหมุน
let cachedOrganizations = null;

// หน่วยงานราชการและร้านค้าที่เปิดบิลเครดิตไว้ รวมยอดค้างชำระของแต่ละราย
const OrganizationList = () => {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState(cachedOrganizations || []);
  const [isLoading, setIsLoading] = useState(!cachedOrganizations);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await listOrganizations();
        const data = res.data || [];
        cachedOrganizations = data;
        if (!cancelled) setOrganizations(data);
      } catch (error) {
        if (!cancelled) toastError(error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useScrollTracking(SCROLL_KEY);
  useScrollRestoration(SCROLL_KEY, !isLoading);

  // ค้นฝั่งเบราว์เซอร์ รายชื่อกลุ่มนี้มีไม่มาก ไม่ต้องยิงถามทุกตัวอักษร
  const keyword = search.trim();
  const visible = keyword
    ? organizations.filter((item) => String(item.name || "").includes(keyword))
    : organizations;

  return (
    <div className="bg-gradient-primary shadow-primary flex min-h-svh w-full flex-col">
      <div className="flex items-center gap-[8px] px-[20px] pt-[16px]">
        <button
          onClick={() =>
            window.history.length > 1
              ? navigate(-1)
              : navigate("/repairs?status=credit")
          }
          aria-label="ย้อนกลับ"
          className="bg-surface/20 flex h-[40px] w-[40px] shrink-0 cursor-pointer items-center justify-center rounded-full"
        >
          <ChevronLeft className="text-surface" />
        </button>
        <p className="text-surface min-w-0 flex-1 truncate text-2xl font-semibold md:text-[26px]">
          หน่วยงานและร้านค้า
        </p>
      </div>

      <div className="bg-surface shadow-primary mt-[16px] flex w-full flex-1 flex-col rounded-tl-2xl rounded-tr-2xl px-[20px] pb-[112px] xl:pb-[16px]">
        <div className="pt-[16px]">
          <SearchBar
            placeholder="ค้นหาชื่อหน่วยงานหรือร้านค้า"
            value={search}
            onSearch={setSearch}
          />
        </div>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <LoaderCircle className="text-primary h-8 w-8 animate-spin" />
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-subtle-light px-[20px] text-center text-xl text-balance md:text-[22px]">
              {keyword ? `ไม่พบ "${keyword}"` : "ไม่มีหน่วยงานและร้านค้า"}
            </p>
          </div>
        ) : (
          visible.map((item) => (
            <Link
              key={item.id}
              to={`/organizations/${item.id}`}
              className="mt-[16px] block w-full"
            >
              {/* ใช้การ์ดตัวเดียวกับรายการบิลทุกหน้า ต่างแค่ของที่ใส่เข้าไป
                  ชื่อหน่วยงานแทนทะเบียน ประเภทกับจำนวนบิลแทนยี่ห้อรุ่น และยอดค้างแทนยอดบิล */}
              <CarCard
                bg="credit"
                icon={<Store className="text-surface h-6 w-6" />}
                licensePlate={item.name}
                brand={organizationLabel(item.organizationType)}
                note={`${item.creditCount} บิล`}
                price={item.creditTotal}
              />
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default OrganizationList;
