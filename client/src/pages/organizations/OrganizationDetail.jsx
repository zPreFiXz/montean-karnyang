import PageSpinner from "@/components/ui/PageSpinner";
import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router";
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
  Package,
  ArrowLeftRight,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { toLocalDateKey } from "@/utils/date";
import CarCard from "@/components/cards/CarCard";
import BrandIcons from "@/components/icons/BrandIcons";
import OutlineCardIcon from "@/components/icons/OutlineCardIcon";
import { listOrganizationRepairs, settleShopPurchases } from "@/api/customer";
import { purchaseAmountOf, purchaseTotalOf } from "@/utils/receipt";
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
  dueNoteOf,
} from "@/utils/repairDisplay";
import {
  formatCurrency,
  formatMonth,
  formatPhone,
  formatQuantity,
  monthKey,
} from "@/utils/formats";
import { withMinDuration } from "@/utils/withMinDuration";
import { toastError } from "@/utils/handleError";
import OrganizationTypeDialog from "@/components/dialogs/OrganizationTypeDialog";
import OrganizationBillPreviewDialog from "@/components/dialogs/OrganizationBillPreviewDialog";
import ShopPurchaseDialog from "@/components/dialogs/ShopPurchaseDialog";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
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
  // อะไหล่ที่เรารับจากร้านค้าที่ยังไม่หักกลบ (มีเฉพาะร้านค้า)
  const [purchases, setPurchases] = useState(cached?.purchases || []);
  // รายการเดิมที่กำลังแก้ (เพิ่มใหม่อยู่หน้าเพิ่มอะไหล่ที่รับมา)
  const [editingPurchase, setEditingPurchase] = useState(null);
  // แท็บอยู่ใน URL กดเข้าบิลแล้วย้อนกลับมายังอยู่แท็บเดิม
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") === "purchases" ? "purchases" : "bills";
  const setTab = (next) => {
    const params = new URLSearchParams(searchParams);
    if (next === "purchases") params.set("tab", next);
    else params.delete("tab");
    setSearchParams(params, { replace: true, state: location.state });
  };
  const [isSettleOpen, setIsSettleOpen] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
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
          purchases: res.data?.purchases || [],
        };
        detailCache.set(String(id), data);
        if (cancelled) return;
        setCustomer(data.customer);
        setRepairs(data.repairs);
        setPurchases(data.purchases);
      } catch (error) {
        if (!cancelled) toastError(error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, reloadToken]);

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
  const isShop = customer?.organizationType === "SHOP";
  const purchaseTotal = purchaseTotalOf(purchases);
  // แยกเดือนแบบเดียวกับแท็บบิล เดือนเก่าสุดก่อน (หักกลบของเก่าก่อน)
  const purchaseGroups = [];
  for (const purchase of purchases) {
    const key = monthKey(purchase.takenAt);
    const last = purchaseGroups[purchaseGroups.length - 1];
    if (last?.key === key) {
      last.items.push(purchase);
      last.total += purchaseAmountOf(purchase);
    } else {
      purchaseGroups.push({
        key,
        title: formatMonth(purchase.takenAt),
        items: [purchase],
        total: purchaseAmountOf(purchase),
      });
    }
  }
  // ติดลบ = ร้านเราต้องจ่ายร้านเขา
  const net = creditTotal - purchaseTotal;
  const hasBillContent = repairs.length > 0 || purchases.length > 0;

  const handleSettle = async () => {
    try {
      await withMinDuration(() =>
        settleShopPurchases(
          customer.id,
          purchases.map((purchase) => purchase.id),
        ),
      );
      toast.success("หักกลบเรียบร้อยแล้ว");
      setIsSettleOpen(false);
      setReloadToken((n) => n + 1);
    } catch (error) {
      toastError(error);
    }
  };

  return (
    <div className="bg-gradient-primary shadow-primary desktop-column flex min-h-svh w-full flex-col">
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
                {/* ประเภทคู่กับปุ่มเปลี่ยน แบบเดียวกับหน้ารายละเอียดบิล (RepairDetailCustomer) */}
                {customer && (
                  <div className="text-subtle-dark flex flex-wrap items-center gap-x-1.5 text-lg leading-tight font-medium md:text-xl">
                    <span>
                      {organizationLabel(customer.organizationType) ||
                        "ลูกค้าทั่วไป"}
                    </span>
                    <span className="text-subtle-light">|</span>
                    <button
                      type="button"
                      onClick={() => setIsTypeDialogOpen(true)}
                      className="text-primary flex cursor-pointer items-center gap-1 font-semibold"
                    >
                      <SquarePen className="h-4 w-4" />
                      เปลี่ยนประเภท
                    </button>
                  </div>
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
              {/* ร้านค้าที่เราไปรับของมาด้วย หักกลบแล้วบอกว่าใครต้องจ่ายใคร (ตรงกับท้ายใบวางบิล) */}
              {purchases.length > 0 && (
                <>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="text-subtle-dark text-lg font-medium md:text-xl">
                      หัก อะไหล่ที่รับจากร้าน {purchases.length} รายการ
                    </p>
                    <p className="text-subtle-dark text-lg font-semibold md:text-xl">
                      {formatCurrency(purchaseTotal)}
                    </p>
                  </div>
                  <div className="border-status-credit/30 mt-2 flex items-center justify-between gap-2 border-t pt-2">
                    <p className="text-subtle-dark text-xl font-semibold md:text-[22px]">
                      {net > 0
                        ? "ร้านค้าต้องชำระ"
                        : net < 0
                          ? "ร้านเราต้องชำระ"
                          : "หักกลบพอดี"}
                    </p>
                    <p
                      className={`text-2xl font-semibold md:text-[26px] ${
                        net < 0 ? "text-destructive" : "text-status-credit"
                      }`}
                    >
                      {formatCurrency(Math.abs(net))}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* ปุ่มขอบ ไม่ใช่ปุ่มทึบ จะได้ไม่แย่งสายตาจากยอดเงินด้านบน */}
            {hasBillContent && (
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="bg-surface text-primary border-primary mt-4 flex h-[41px] w-full cursor-pointer items-center justify-center gap-2 rounded-[20px] border text-lg font-semibold md:text-xl"
              >
                <Printer className="h-5 w-5" />
                พิมพ์ใบวางบิล
              </button>
            )}

            {/* ร้านค้ามีอะไหล่ที่เรารับจากร้านอีกชุด แยกแท็บ ไม่ต้องเลื่อนผ่านบิลทั้งหมดกว่าจะเจอ */}
            {/* แถบเดียวกับแท็บในหน้ารายงานและหน้าต่างรุ่นรถ (พื้นขาวใช้แถบเลื่อน) */}
            {isShop && (
              <div
                role="tablist"
                className="relative mt-4 flex w-full rounded-lg bg-gray-100 p-1"
              >
                <div
                  aria-hidden="true"
                  className="bg-gradient-primary absolute top-1 bottom-1 left-1 w-[calc((100%-8px)/2)] rounded-lg shadow-lg duration-300 ease-out"
                  style={{
                    transform: `translateX(${tab === "purchases" ? 100 : 0}%)`,
                  }}
                />
                {[
                  { id: "bills", label: "บิลเครดิต", count: repairs.length },
                  {
                    id: "purchases",
                    label: "อะไหล่ที่รับมา",
                    count: purchases.length,
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={tab === item.id}
                    onClick={() => setTab(item.id)}
                    className={`relative z-10 flex h-10 flex-1 cursor-pointer items-center justify-center rounded-lg text-lg font-semibold duration-300 ease-out md:text-xl ${
                      tab === item.id ? "text-white" : "text-subtle-dark"
                    }`}
                  >
                    {item.count > 0
                      ? `${item.label} (${item.count})`
                      : item.label}
                  </button>
                ))}
              </div>
            )}

            {isShop && tab === "purchases" ? null : repairs.length === 0 ? (
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
                    {/* ใบเดียวยอดรวมเท่าราคาบนการ์ดใต้มัน ไม่ต้องขึ้นซ้ำ */}
                    {group.repairs.length > 1 && (
                      <p className="text-status-credit text-lg font-semibold md:text-xl">
                        {formatCurrency(group.total)}
                      </p>
                    )}
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
                        dueNote={dueNoteOf(item, toLocalDateKey())}
                        price={Number(item.totalPrice) || 0}
                      />
                    </Link>
                  ))}
                </div>
              ))
            )}

            {isShop && tab === "purchases" && (
              <>
                {/* ปุ่มเส้นประแบบเดียวกับเพิ่มรถรุ่นอื่นหรือเพิ่มเบอร์รถ ชื่อแท็บบอกอยู่แล้วจึงไม่มีหัวข้อซ้ำ */}
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/organizations/${id}/purchases/new`, {
                      state: { organization: customer },
                    })
                  }
                  className="text-subtle-light mt-4 flex h-[41px] w-full cursor-pointer items-center justify-center gap-2 rounded-[20px] border-2 border-dashed border-gray-300 text-lg font-medium transition-colors duration-200 hover:border-gray-400 hover:bg-gray-50 md:text-xl"
                >
                  <Plus className="h-5 w-5" />
                  เพิ่มอะไหล่ที่รับมา
                </button>
                {purchases.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center">
                    <p className="text-subtle-light px-5 text-center text-xl text-balance md:text-[22px]">
                      ไม่มีอะไหล่ที่รับจากร้าน
                    </p>
                  </div>
                ) : (
                  <>
                    {purchaseGroups.map((group) => (
                      <div key={group.key}>
                        <div className="mt-4 flex items-center gap-2">
                          <p className="text-subtle-dark text-lg font-semibold md:text-xl">
                            {group.title}
                          </p>
                          <span className="text-subtle-light text-lg md:text-xl">
                            ({group.items.length})
                          </span>
                          <div className="bg-subtle-light/40 h-px flex-1" />
                          {group.items.length > 1 && (
                            <p className="text-primary text-lg font-semibold md:text-xl">
                              {formatCurrency(group.total)}
                            </p>
                          )}
                        </div>
                        {group.items.map((purchase) => (
                          <button
                            key={purchase.id}
                            type="button"
                            onClick={() => setEditingPurchase(purchase)}
                            className="mt-4 block w-full cursor-pointer text-left"
                          >
                            <CarCard
                              bg="primary"
                              icon={
                                <OutlineCardIcon
                                  icon={Package}
                                  color="#1976d2"
                                />
                              }
                              licensePlate={purchase.itemName}
                              brand={`${formatQuantity(purchase.quantity)}${
                                purchase.unit ? ` ${purchase.unit}` : ""
                              } × ${formatCurrency(purchase.unitPrice)}`}
                              price={purchaseAmountOf(purchase) || 0}
                            />
                          </button>
                        ))}
                      </div>
                    ))}
                    {/* ตกลงเงินกับร้านเสร็จแล้วกดปิดรายการ บิลเครดิตยังต้องรับเงินทีละบิลตามปกติ */}
                    <button
                      type="button"
                      onClick={() => setIsSettleOpen(true)}
                      className="bg-surface text-primary border-primary mt-4 flex h-[41px] w-full cursor-pointer items-center justify-center gap-2 rounded-[20px] border text-lg font-semibold md:text-xl"
                    >
                      <ArrowLeftRight className="h-5 w-5" />
                      หักกลบแล้ว
                    </button>
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
      <OrganizationBillPreviewDialog
        customer={customer}
        repairs={repairs}
        purchases={purchases}
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
      />

      {isShop && (
        <>
          <ShopPurchaseDialog
            isOpen={!!editingPurchase}
            onClose={() => setEditingPurchase(null)}
            shop={customer}
            editingItem={editingPurchase}
            onSaved={() => setReloadToken((n) => n + 1)}
          />
        </>
      )}

      <ConfirmDialog
        isOpen={isSettleOpen}
        onClose={() => setIsSettleOpen(false)}
        onConfirm={handleSettle}
        title="ยืนยันการหักกลบ"
        itemName={`อะไหล่ที่รับจากร้าน ${purchases.length} รายการ`}
        itemDetail={formatCurrency(purchaseTotal)}
        note="รายการจะหายจากหน้านี้และไม่อยู่ในใบวางบิลอีก บิลเครดิตยังต้องรับเงินทีละบิลตามปกติ"
        confirmLabel="หักกลบ"
        confirmClass="bg-gradient-primary"
        requireHold={false}
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
