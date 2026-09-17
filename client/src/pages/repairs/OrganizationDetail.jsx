import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  ChevronLeft,
  LoaderCircle,
  Phone,
  MapPin,
  Wrench,
  ShoppingBag,
  Store,
  CalendarDays,
  SquarePen,
} from "lucide-react";
import RepairCard from "@/components/cards/RepairCard";
import { listOrganizationRepairs } from "@/api/customer";
import { organizationLabel } from "@/constants/organizations";
import { isSaleRepair } from "@/utils/repairDisplay";
import {
  formatCurrency,
  formatDate,
  formatMonth,
  formatPhone,
} from "@/utils/formats";
import { toastError } from "@/utils/handleError";
import OrganizationTypeDialog from "@/components/dialogs/OrganizationTypeDialog";
import {
  useScrollRestoration,
  useScrollTracking,
} from "@/utils/scrollPosition";

// บิลเครดิตทั้งหมดของหน่วยงานหรือร้านค้ารายเดียว พร้อมยอดค้างรวม
const OrganizationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [repairs, setRepairs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  // แก้ประเภทได้จากหน้านี้ด้วย ไม่งั้นพอไม่เหลือบิลเครดิตให้กดเข้าไปก็แก้ไม่ได้อีกเลย
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await listOrganizationRepairs(id);
        if (cancelled) return;
        setCustomer(res.data?.customer || null);
        setRepairs(res.data?.repairs || []);
      } catch (error) {
        if (!cancelled) toastError(error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const scrollKey = `organization:${id}`;
  useScrollTracking(scrollKey);
  useScrollRestoration(scrollKey, !isLoading);

  // บิลเรียงใหม่สุดมาก่อนจากเซิร์ฟเวอร์ ใบสุดท้ายจึงเป็นใบที่ค้างมานานที่สุด
  const oldestUnpaid = repairs.length
    ? repairs[repairs.length - 1].createdAt
    : null;

  const creditTotal = repairs.reduce(
    (sum, repair) => sum + (Number(repair.totalPrice) || 0),
    0,
  );

  return (
    <div className="bg-gradient-primary shadow-primary flex min-h-svh w-full flex-col">
      <div className="flex items-center gap-[8px] px-[20px] pt-[16px]">
        <button
          onClick={() =>
            window.history.length > 1
              ? navigate(-1)
              : navigate("/organizations")
          }
          aria-label="ย้อนกลับ"
          className="bg-surface/20 flex h-[40px] w-[40px] shrink-0 cursor-pointer items-center justify-center rounded-full"
        >
          <ChevronLeft className="text-surface" />
        </button>
        {/* หัวหน้าจอบอกว่าอยู่หน้าอะไร ส่วนชื่อหน่วยงานอยู่ในเนื้อหาข้างล่าง
            เหมือนหน้าประวัติรถที่หัวไม่ได้เขียนทะเบียน */}
        <p className="text-surface min-w-0 flex-1 truncate text-2xl font-semibold md:text-[26px]">
          หน่วยงานและร้านค้า
        </p>
      </div>

      <div className="bg-surface shadow-primary mt-[16px] flex w-full flex-1 flex-col rounded-tl-2xl rounded-tr-2xl px-[20px] pb-[112px] xl:pb-[16px]">
        {/* หัวของหน่วยงาน วางแบบเดียวกับแถวลูกค้าในหน้าบิล
            วงกลมไอคอนสีสถานะ ตามด้วยชื่อและประเภท */}
        <div className="mt-[16px] flex items-start gap-[8px]">
          <div className="bg-status-credit mt-[2px] flex aspect-square h-[45px] w-[45px] items-center justify-center rounded-full">
            <Store className="text-surface h-6 w-6" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="text-status-credit text-[22px] leading-tight font-semibold md:text-2xl">
              {customer?.name || ""}
            </p>
            {customer?.organizationType && (
              <p className="text-subtle-dark text-lg leading-tight font-medium md:text-xl">
                {organizationLabel(customer.organizationType)}
              </p>
            )}
            {(customer?.phoneNumber || customer?.address) && (
              <div className="mt-[4px] flex flex-wrap items-start gap-[8px]">
                {customer.phoneNumber && (
                  <div className="flex shrink-0 items-center gap-[4px]">
                    <Phone size={16} className="text-subtle-dark" />
                    <a
                      href={`tel:${customer.phoneNumber}`}
                      className="text-subtle-dark text-lg leading-tight font-medium underline md:text-xl"
                    >
                      {formatPhone(customer.phoneNumber)}
                    </a>
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-start gap-[4px]">
                    <MapPin
                      size={16}
                      className="text-subtle-dark mt-[2px] shrink-0"
                    />
                    <p className="text-subtle-dark text-lg leading-tight font-medium md:text-xl">
                      {customer.address}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsTypeDialogOpen(true)}
            aria-label="แก้ประเภทลูกค้า"
            title="แก้ประเภทลูกค้า"
            className="bg-subtle-light/15 mt-[2px] flex h-[40px] w-[40px] shrink-0 cursor-pointer items-center justify-center rounded-full"
          >
            <SquarePen className="text-subtle-dark h-5 w-5" />
          </button>
          {/* บิลที่เก็บเงินไปแล้วไม่อยู่ในหน้านี้ ดูย้อนหลังได้ที่ประวัติรายเดือน */}
          <Link
            to={`/organizations/${id}/history`}
            aria-label="ประวัติย้อนหลัง"
            title="ประวัติย้อนหลัง"
            className="bg-subtle-light/15 mt-[2px] flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full"
          >
            <CalendarDays className="text-subtle-dark h-5 w-5" />
          </Link>
        </div>

        {/* กล่องยอดรวมแบบเดียวกับท้ายบิล พื้นไล่สีจางของสถานะเครดิต */}
        <div className="border-status-credit/30 from-status-credit/10 to-status-credit/5 mt-[16px] rounded-[10px] border bg-gradient-to-r p-[16px]">
          <div className="flex items-center justify-between gap-[8px]">
            <div className="min-w-0">
              <p className="text-subtle-dark text-xl font-semibold md:text-[22px]">
                ยอดค้างชำระ
              </p>
              {/* ยึดบิลเก่าสุดที่ยังไม่ได้เก็บเงิน บอกว่าค้างมานานแค่ไหน
                  ใช้ได้ทั้งกรณีบิลเดือนเดียวและค้างข้ามหลายเดือน */}
              {oldestUnpaid && (
                <p className="text-subtle-light text-base leading-tight font-medium md:text-lg">
                  ค้างตั้งแต่ {formatMonth(oldestUnpaid)}
                </p>
              )}
            </div>
            <p className="text-status-credit text-2xl font-semibold md:text-[26px]">
              {formatCurrency(creditTotal)}
            </p>
          </div>
        </div>

        <div className="mt-[16px] flex items-center gap-[8px]">
          <p className="text-normal text-[22px] font-semibold md:text-2xl">
            บิลเครดิต
          </p>
          {!isLoading && repairs.length > 0 && (
            <span className="text-subtle-light shrink-0 text-lg font-medium md:text-xl">
              ({repairs.length})
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <LoaderCircle className="text-primary h-8 w-8 animate-spin" />
          </div>
        ) : repairs.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-subtle-light px-[20px] text-center text-xl text-balance md:text-[22px]">
              ไม่มีบิลเครดิต
            </p>
          </div>
        ) : (
          repairs.map((item) => (
            <Link
              key={item.id}
              to={`/repairs/${item.id}`}
              className="mt-[16px] block w-full"
            >
              {/* การ์ดเดียวกับหน้าประวัติรถ เพราะเป็นการไล่บิลของเจ้าของรายเดียวเหมือนกัน
                  วันที่เป็นบรรทัดหลัก บรรทัดรองบอกจำนวนรายการ ไม่ต้องมีชื่อหน่วยงานซ้ำทุกใบ */}
              <RepairCard
                icon={isSaleRepair(item) ? ShoppingBag : Wrench}
                itemCount={item.repairItems?.length}
                dateText={formatDate(item.createdAt)}
                price={Number(item.totalPrice) || 0}
                status={item.status}
              />
            </Link>
          ))
        )}
      </div>
      {customer && (
        <OrganizationTypeDialog
          isOpen={isTypeDialogOpen}
          onClose={() => setIsTypeDialogOpen(false)}
          customer={customer}
          onSaved={(type) => {
            // ไม่ใช่หน่วยงานหรือร้านค้าแล้ว รายนี้จึงไม่มีที่อยู่ในหน้านี้อีก กลับไปหน้ารายชื่อ
            if (!type) {
              navigate("/organizations", { replace: true });
              return;
            }
            setCustomer((prev) => ({ ...prev, organizationType: type }));
          }}
        />
      )}
    </div>
  );
};

export default OrganizationDetail;
