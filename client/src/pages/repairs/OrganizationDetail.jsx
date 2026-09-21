import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import {
  ChevronLeft,
  LoaderCircle,
  Phone,
  MapPin,
  ShoppingBag,
  Store,
  Printer,
  History,
  SquarePen,
} from "lucide-react";
import CarCard from "@/components/cards/CarCard";
import BrandIcons from "@/components/icons/BrandIcons";
import { listOrganizationRepairs } from "@/api/customer";
import { organizationLabel, creditPathFor } from "@/constants/organizations";
import {
  isSaleRepair,
  isNoVehicleRepair,
  getRepairTitle,
  getRepairSubtitle,
} from "@/utils/repairDisplay";
import { formatCurrency, formatDateShort, formatPhone } from "@/utils/formats";
import { Wrench } from "@/components/icons/Icons";
import { toastError } from "@/utils/handleError";
import OrganizationTypeDialog from "@/components/dialogs/OrganizationTypeDialog";
import OrganizationBillPreviewDialog from "@/components/dialogs/OrganizationBillPreviewDialog";
import {
  useScrollRestoration,
  useScrollTracking,
} from "@/utils/scrollPosition";

// จำผลของแต่ละรายไว้ กดกลับเข้ามาซ้ำจะได้มีของโชว์ตั้งแต่เฟรมแรก ไม่ต้องขึ้นตัวหมุน
const detailCache = new Map();

// บิลเครดิตทั้งหมดของหน่วยงานหรือร้านค้ารายเดียว พร้อมยอดค้างรวม
const OrganizationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // ชื่อกับประเภทมากับการกดจากหน้ารายชื่อ ขึ้นได้ทันทีตั้งแต่เฟรมแรก
  // ส่วนบิลต้องขอจากเซิร์ฟเวอร์ ถ้าเคยเปิดรายนี้แล้วก็ใช้ของที่จำไว้ไปก่อน
  const cached = detailCache.get(String(id));
  const [customer, setCustomer] = useState(
    cached?.customer || location.state?.organization || null,
  );
  const [repairs, setRepairs] = useState(cached?.repairs || []);
  const [isLoading, setIsLoading] = useState(!cached);
  // แก้ประเภทได้จากหน้านี้ด้วย ไม่งั้นพอไม่เหลือบิลเครดิตให้กดเข้าไปก็แก้ไม่ได้อีกเลย
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false);
  // ประเภทที่เพิ่งเปลี่ยนระหว่างเปิดหน้านี้ ใช้เลือกปลายทางของปุ่มย้อนกลับ
  const changedTypeRef = useRef(undefined);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await listOrganizationRepairs(id);
        const data = {
          customer: res.data?.customer || null,
          repairs: res.data?.repairs || [],
        };
        detailCache.set(String(id), data);
        if (cancelled) return;
        setCustomer(data.customer);
        setRepairs(data.repairs);
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

  const creditTotal = repairs.reduce(
    (sum, repair) => sum + (Number(repair.totalPrice) || 0),
    0,
  );

  return (
    <div className="bg-gradient-primary shadow-primary flex min-h-svh w-full flex-col">
      <div className="flex items-center gap-[8px] px-[20px] pt-[16px]">
        <button
          // เปลี่ยนประเภทไประหว่างเปิดหน้านี้ = กองที่มาตอนแรกไม่มีรายนี้แล้ว
          // พาไปกองใหม่แทนการถอยกลับไปเจอรายชื่อที่หายไปหนึ่งราย
          onClick={() => {
            if (changedTypeRef.current !== undefined) {
              navigate(creditPathFor(changedTypeRef.current), {
                replace: true,
              });
              return;
            }

            if (window.history.length > 1) {
              navigate(-1);
              return;
            }

            navigate("/organizations");
          }}
          aria-label="ย้อนกลับ"
          className="bg-surface/20 flex h-[40px] w-[40px] shrink-0 cursor-pointer items-center justify-center rounded-full"
        >
          <ChevronLeft className="text-surface" />
        </button>
        {/* หัวหน้าจอบอกว่าอยู่กองไหน ส่วนชื่อหน่วยงานอยู่ในเนื้อหาข้างล่าง
            เหมือนหน้าประวัติรถที่หัวไม่ได้เขียนทะเบียน */}
        <p className="text-surface min-w-0 flex-1 truncate text-2xl font-semibold md:text-[26px]">
          เครดิต
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
          {/* ใบวางบิลสำหรับเอาไปวางที่หน่วยงาน ขึ้นเฉพาะตอนมีบิลค้าง */}
          {repairs.length > 0 && (
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              aria-label="พิมพ์ใบวางบิล"
              title="พิมพ์ใบวางบิล"
              className="bg-subtle-light/15 mt-[2px] flex h-[40px] w-[40px] shrink-0 cursor-pointer items-center justify-center rounded-full"
            >
              <Printer className="text-subtle-dark h-5 w-5" />
            </button>
          )}
          {/* บิลที่เก็บเงินไปแล้วไม่อยู่ในหน้านี้ ดูย้อนหลังได้ที่ประวัติรายเดือน */}
          <Link
            to={`/organizations/${id}/history`}
            aria-label="ประวัติย้อนหลัง"
            title="ประวัติย้อนหลัง"
            className="bg-subtle-light/15 mt-[2px] flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full"
          >
            <History className="text-subtle-dark h-5 w-5" />
          </Link>
        </div>

        {/* กล่องยอดรวมแบบเดียวกับท้ายบิล พื้นไล่สีจางของสถานะเครดิต */}
        <div className="border-status-credit/30 from-status-credit/10 to-status-credit/5 mt-[16px] rounded-[10px] border bg-gradient-to-r p-[16px]">
          <div className="flex items-center justify-between gap-[8px]">
            <p className="text-subtle-dark text-xl font-semibold md:text-[22px]">
              ค้างชำระ {repairs.length} บิล
            </p>
            <p className="text-status-credit text-2xl font-semibold md:text-[26px]">
              {formatCurrency(creditTotal)}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <LoaderCircle className="text-primary h-8 w-8 animate-spin" />
          </div>
        ) : repairs.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-subtle-light px-[20px] text-center text-xl text-balance md:text-[22px]">
              ไม่มีบิลค้างชำระ
            </p>
          </div>
        ) : (
          repairs.map((item) => (
            <Link
              key={item.id}
              to={`/repairs/${item.id}`}
              className="mt-[16px] block w-full"
            >
              {/* การ์ดแบบเดียวกับรายการบิลหน้าอื่น ทะเบียนเป็นบรรทัดหลัก
                  ตามด้วยยี่ห้อรุ่นกับวันที่ และยอดเงินขวาสุด */}
              <CarCard
                bg="credit"
                icon={
                  isSaleRepair(item) ? (
                    <ShoppingBag className="text-surface h-6 w-6" />
                  ) : isNoVehicleRepair(item) ? (
                    <Wrench />
                  ) : (
                    <BrandIcons
                      brand={item.vehicle?.vehicleModel?.brand}
                      color="#7c3aed"
                    />
                  )
                }
                licensePlate={getRepairTitle(item)}
                brand={getRepairSubtitle(item)}
                note={formatDateShort(item.createdAt)}
                price={Number(item.totalPrice) || 0}
              />
            </Link>
          ))
        )}
      </div>
      <OrganizationBillPreviewDialog
        customer={customer}
        repairs={repairs}
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
      />

      {customer && (
        <OrganizationTypeDialog
          isOpen={isTypeDialogOpen}
          onClose={() => setIsTypeDialogOpen(false)}
          customer={customer}
          // ทั้งสามปุ่มทำเหมือนกัน คืออยู่หน้าเดิมแล้วอัปเดตให้เห็นผลทันที
          // ส่วนการย้ายกองไปเกิดตอนกดย้อนกลับ (หน้านี้ยังดูบิลค้างกับประวัติได้เหมือนเดิม)
          onSaved={(type) => {
            changedTypeRef.current = type;
            setCustomer((prev) => ({ ...prev, organizationType: type }));
          }}
        />
      )}
    </div>
  );
};

export default OrganizationDetail;
