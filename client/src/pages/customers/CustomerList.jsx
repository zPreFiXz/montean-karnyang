import PageSpinner from "@/components/ui/PageSpinner";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { ChevronLeft } from "lucide-react";
import SearchBar from "@/components/forms/SearchBar";
import CarCard from "@/components/cards/CarCard";
import { listCustomerDirectory } from "@/api/customer";
import { organizationIcon, organizationLabel } from "@/constants/organizations";
import { formatDateShort, formatPhone } from "@/utils/formats";
import { toastError } from "@/utils/handleError";
import {
  useScrollRestoration,
  useScrollTracking,
} from "@/utils/scrollPosition";

const SCROLL_KEY = "customers";

// จำผลไว้ กดย้อนกลับมาจะมีรายการตั้งแต่เฟรมแรก
let cachedCustomers = null;

const nameCollator = new Intl.Collator("th");

// เรียงตามชื่อแบบสมุดรายชื่อ ลูกค้าที่มีแต่เบอร์ไปอยู่ท้าย
const sortCustomers = (list) =>
  [...list].sort((a, b) => {
    if (!a.name && b.name) return 1;
    if (a.name && !b.name) return -1;
    return nameCollator.compare(
      a.name || a.phoneNumber || "",
      b.name || b.phoneNumber || "",
    );
  });

const CustomerList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const search = (searchParams.get("search") || "").trim();

  const [customers, setCustomers] = useState(cachedCustomers || []);
  const [isLoading, setIsLoading] = useState(!cachedCustomers);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await listCustomerDirectory();
        const sorted = sortCustomers(res.data || []);
        cachedCustomers = sorted;
        if (!cancelled) setCustomers(sorted);
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

  // เบอร์ในฐานข้อมูลไม่มีขีด ตัดขีดและเว้นวรรคออกจากคำค้นก่อนเทียบ
  const digits = search.replace(/[\s-]/g, "");
  const visibleCustomers = search
    ? customers.filter(
        (item) =>
          item.name?.toLowerCase().includes(search.toLowerCase()) ||
          (/^\d+$/.test(digits) && item.phoneNumber?.includes(digits)),
      )
    : customers;

  const searchTerm = search.length > 20 ? `${search.slice(0, 20)}…` : search;

  return (
    <div className="bg-gradient-primary shadow-primary flex min-h-svh w-full flex-col">
      <div className="flex items-center gap-2 px-5 pt-4">
        <button
          onClick={() =>
            window.history.length > 1 ? navigate(-1) : navigate("/vehicles")
          }
          aria-label="ย้อนกลับ"
          className="bg-surface/20 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full"
        >
          <ChevronLeft className="text-surface" />
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <p className="text-surface truncate text-2xl font-semibold md:text-[26px]">
            รายชื่อลูกค้า
          </p>
          {!isLoading && visibleCustomers.length > 0 && (
            <span className="text-surface/70 shrink-0 text-xl font-medium md:text-[22px]">
              ({visibleCustomers.length})
            </span>
          )}
        </div>
      </div>

      <div className="bg-surface shadow-primary mt-4 flex w-full flex-1 flex-col rounded-tl-2xl rounded-tr-2xl pb-28 xl:pb-4">
        <div className="flex flex-1 flex-col px-5 pt-4">
          <SearchBar placeholder="ค้นหาชื่อลูกค้า, เบอร์โทร" />

          {isLoading ? (
            <PageSpinner />
          ) : visibleCustomers.length === 0 ? (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-subtle-light px-5 text-center text-xl text-balance md:text-[22px]">
                {search ? `ไม่พบ "${searchTerm}"` : "ไม่มีลูกค้า"}
              </p>
            </div>
          ) : (
            visibleCustomers.map((item) => {
              const Icon = organizationIcon(item.organizationType);
              return (
                <Link
                  key={item.id}
                  to={`/customers/${item.id}`}
                  className="mt-4 block w-full"
                >
                  <CarCard
                    bg="primary"
                    icon={<Icon className="text-surface h-6 w-6" />}
                    licensePlate={item.name || formatPhone(item.phoneNumber)}
                    brand={[
                      organizationLabel(item.organizationType),
                      item.name && item.phoneNumber
                        ? formatPhone(item.phoneNumber)
                        : "",
                      item.lastVisitAt ? formatDateShort(item.lastVisitAt) : "",
                    ]
                      .filter(Boolean)
                      .join(" | ")}
                    amount={item.vehicleCount}
                  />
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerList;
