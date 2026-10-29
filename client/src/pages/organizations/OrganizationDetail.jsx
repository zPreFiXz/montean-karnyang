import PageSpinner from "@/components/ui/PageSpinner";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import {
  ChevronLeft,
  Phone,
  MapPin,
  IdCard,
  ShoppingBag,
  Wrench as WrenchOutline,
  Printer,
  History,
  SquarePen,
} from "lucide-react";
import CarCard from "@/components/cards/CarCard";
import BrandIcons from "@/components/icons/BrandIcons";
import OutlineCardIcon from "@/components/icons/OutlineCardIcon";
import { listOrganizationRepairs } from "@/api/customer";
import {
  organizationIcon,
  organizationLabel,
  creditPathFor,
} from "@/constants/organizations";
import {
  isSaleRepair,
  isNoVehicleRepair,
  getRepairTitle,
  getCustomerBillSubtitle,
} from "@/utils/repairDisplay";
import {
  formatCurrency,
  formatMonth,
  formatPhone,
  monthKey,
} from "@/utils/formats";
import { toastError } from "@/utils/handleError";
import OrganizationTypeDialog from "@/components/dialogs/OrganizationTypeDialog";
import OrganizationBillPreviewDialog from "@/components/dialogs/OrganizationBillPreviewDialog";
import {
  useScrollRestoration,
  useScrollTracking,
} from "@/utils/scrollPosition";

// จำผลไว้ กดกลับเข้ามาซ้ำจะมีของโชว์ตั้งแต่เฟรมแรก
const detailCache = new Map();

const OrganizationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const cached = detailCache.get(String(id));
  const [customer, setCustomer] = useState(
    cached?.customer || location.state?.organization || null,
  );
  const [repairs, setRepairs] = useState(cached?.repairs || []);
  const [isLoading, setIsLoading] = useState(!cached);
  // แก้ประเภทได้จากหน้านี้ด้วย ไม่งั้นพอไม่เหลือบิลเครดิตให้กดเข้าไปก็แก้ไม่ได้อีกเลย
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false);
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

  // วางบิลกันเป็นรายเดือน แยกเดือนพร้อมยอดของเดือนนั้น เดือนเก่าสุดขึ้นก่อนเพราะควรเก็บก่อน
  // แต่ในเดือนเดียวกันบิลล่าสุดอยู่บน
  const monthGroups = [];
  [...repairs]
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .forEach((repair) => {
      const key = monthKey(repair.createdAt);
      let group = monthGroups[monthGroups.length - 1];
      if (group?.key !== key) {
        group = {
          key,
          title: formatMonth(repair.createdAt),
          repairs: [],
          total: 0,
        };
        monthGroups.push(group);
      }
      group.repairs.unshift(repair);
      group.total += Number(repair.totalPrice) || 0;
    });

  const creditTotal = repairs.reduce(
    (sum, repair) => sum + (Number(repair.totalPrice) || 0),
    0,
  );

  const OrganizationIcon = organizationIcon(customer?.organizationType);

  return (
    <div className="bg-gradient-primary shadow-primary flex min-h-svh w-full flex-col">
      <div className="flex items-center gap-2 px-5 pt-4">
        <button
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
              return;
            }

            navigate("/organizations");
          }}
          aria-label="ย้อนกลับ"
          className="bg-surface/20 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full"
        >
          <ChevronLeft className="text-surface" />
        </button>
        <p className="text-surface min-w-0 flex-1 truncate text-2xl font-semibold md:text-[26px]">
          เครดิต
        </p>

        {/* รอข้อมูลก่อนค่อยขึ้นพร้อมกัน ไม่งั้นปุ่มพิมพ์แทรกเข้ามาทีหลังแล้วดันปุ่มอื่น */}
        {!isLoading && (
          <>
            <Link
              to={`/organizations/${id}/history`}
              aria-label="ประวัติบิล"
              title="ประวัติบิล"
              className="bg-surface/20 flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            >
              <History className="text-surface h-5 w-5" />
            </Link>
          </>
        )}
      </div>

      <div className="bg-surface shadow-primary mt-4 flex w-full flex-1 flex-col rounded-tl-2xl rounded-tr-2xl px-5 pb-28 xl:pb-4">
        {isLoading ? (
          <PageSpinner />
        ) : (
          <>
            <div className="mt-4 flex items-start gap-2">
              <div className="bg-status-credit mt-0.5 flex aspect-square h-[45px] w-[45px] items-center justify-center rounded-full">
                <OrganizationIcon className="text-surface h-6 w-6" />
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
                {(customer?.phoneNumber ||
                  customer?.address ||
                  customer?.taxId) && (
                  <div className="mt-1 flex flex-wrap items-start gap-2">
                    {customer.phoneNumber && (
                      <div className="flex shrink-0 items-center gap-1">
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
                      <div className="flex items-start gap-1">
                        <MapPin
                          size={16}
                          className="text-subtle-dark mt-0.5 shrink-0"
                        />
                        <p className="text-subtle-dark text-lg leading-tight font-medium md:text-xl">
                          {customer.address}
                        </p>
                      </div>
                    )}
                    {customer.taxId && (
                      <div className="flex shrink-0 items-center gap-1">
                        <IdCard size={16} className="text-subtle-dark" />
                        <p className="text-subtle-dark text-lg leading-tight font-medium md:text-xl">
                          {customer.taxId}
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
                className="bg-subtle-light/15 mt-0.5 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full"
              >
                <SquarePen className="text-subtle-dark h-5 w-5" />
              </button>
            </div>

            <div className="border-status-credit/30 from-status-credit/10 to-status-credit/5 mt-4 rounded-lg border bg-gradient-to-r p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-subtle-dark text-xl font-semibold md:text-[22px]">
                  เครดิต {repairs.length} บิล
                </p>
                <p className="text-status-credit text-2xl font-semibold md:text-[26px]">
                  {formatCurrency(creditTotal)}
                </p>
              </div>
            </div>

            {/* ปุ่มขอบ ไม่ใช่ปุ่มทึบ จะได้ไม่แย่งสายตาจากยอดเงินด้านบน */}
            {repairs.length > 0 && (
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="bg-surface text-primary border-primary mt-4 flex h-[41px] w-full cursor-pointer items-center justify-center gap-2 rounded-[20px] border text-lg font-semibold md:text-xl"
              >
                <Printer className="h-5 w-5" />
                พิมพ์ใบวางบิล
              </button>
            )}

            {repairs.length === 0 ? (
              <div className="flex flex-1 items-center justify-center">
                <p className="text-subtle-light px-5 text-center text-xl text-balance md:text-[22px]">
                  ไม่มีบิลเครดิต
                </p>
              </div>
            ) : (
              monthGroups.map((group) => (
                <div key={group.key}>
                  <div className="mt-4 flex items-center gap-2">
                    <p className="text-subtle-dark text-lg font-semibold md:text-xl">
                      {group.title}
                    </p>
                    <span className="text-subtle-light text-lg md:text-xl">
                      ({group.repairs.length})
                    </span>
                    <div className="bg-subtle-light/40 h-px flex-1" />
                    <p className="text-status-credit text-lg font-semibold md:text-xl">
                      {formatCurrency(group.total)}
                    </p>
                  </div>
                  {group.repairs.map((item) => (
                    <Link
                      key={item.id}
                      to={`/repairs/${item.id}`}
                      className="mt-4 block w-full"
                    >
                      <CarCard
                        bg="credit"
                        icon={
                          isSaleRepair(item) ? (
                            <OutlineCardIcon
                              icon={ShoppingBag}
                              color="#7c3aed"
                            />
                          ) : isNoVehicleRepair(item) ? (
                            <OutlineCardIcon
                              icon={WrenchOutline}
                              color="#7c3aed"
                            />
                          ) : (
                            <BrandIcons
                              brand={item.vehicle?.vehicleModel?.brand}
                              color="#7c3aed"
                            />
                          )
                        }
                        licensePlate={getRepairTitle(item)}
                        brand={getCustomerBillSubtitle(item)}
                        price={Number(item.totalPrice) || 0}
                      />
                    </Link>
                  ))}
                </div>
              ))
            )}
          </>
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
          // ย้ายกองแล้วกองเดิมไม่มีรายนี้ พาไปแท็บของประเภทใหม่ทันที
          onSaved={(type) => navigate(creditPathFor(type), { replace: true })}
        />
      )}
    </div>
  );
};

export default OrganizationDetail;
