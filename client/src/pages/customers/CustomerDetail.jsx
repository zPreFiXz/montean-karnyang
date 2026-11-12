import PageSpinner from "@/components/ui/PageSpinner";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ChevronLeft, IdCard, MapPin, Phone } from "lucide-react";
import CarCard from "@/components/cards/CarCard";
import BrandIcons from "@/components/icons/BrandIcons";
import { getCustomer } from "@/api/customer";
import { organizationIcon, organizationLabel } from "@/constants/organizations";
import { formatDateShort, formatPhone, formatPlate } from "@/utils/formats";
import { getDisplayBrand } from "@/utils/repairDisplay";
import { toastError } from "@/utils/handleError";

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      try {
        const res = await getCustomer(id);
        if (!cancelled) setCustomer(res.data);
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

  const Icon = organizationIcon(customer?.organizationType);
  const vehicles = customer?.vehicles || [];

  return (
    <div className="bg-gradient-primary shadow-primary flex min-h-svh w-full flex-col">
      <div className="flex items-center gap-2 px-5 pt-4">
        <button
          onClick={() =>
            window.history.length > 1 ? navigate(-1) : navigate("/customers")
          }
          aria-label="ย้อนกลับ"
          className="bg-surface/20 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full"
        >
          <ChevronLeft className="text-surface" />
        </button>
        <p className="text-surface min-w-0 flex-1 truncate text-2xl font-semibold md:text-[26px]">
          ลูกค้า
        </p>
      </div>

      <div className="bg-surface shadow-primary mt-4 flex w-full flex-1 flex-col rounded-tl-2xl rounded-tr-2xl px-5 pb-28 xl:pb-4">
        {isLoading ? (
          <PageSpinner />
        ) : !customer ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-subtle-light px-5 text-center text-xl text-balance md:text-[22px]">
              ไม่พบลูกค้า
            </p>
          </div>
        ) : (
          <>
            <div className="mt-4 flex items-start gap-2">
              <div className="bg-primary mt-0.5 flex aspect-square h-[45px] w-[45px] items-center justify-center rounded-full">
                <Icon className="text-surface h-6 w-6" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="text-primary text-[22px] leading-tight font-semibold md:text-2xl">
                  {customer.name || formatPhone(customer.phoneNumber)}
                </p>
                {customer.organizationType && (
                  <p className="text-subtle-dark text-lg leading-tight font-medium md:text-xl">
                    {organizationLabel(customer.organizationType)}
                  </p>
                )}
                {(customer.phoneNumber ||
                  customer.address ||
                  customer.taxId) && (
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

            <div className="mt-6 flex items-center gap-2">
              <p className="text-normal text-[22px] font-semibold md:text-2xl">
                รถของลูกค้า
              </p>
              {vehicles.length > 0 && (
                <span className="text-subtle-light shrink-0 text-lg font-medium md:text-xl">
                  ({vehicles.length})
                </span>
              )}
            </div>

            {vehicles.length === 0 ? (
              <div className="flex flex-1 items-center justify-center">
                <p className="text-subtle-light px-5 text-center text-xl text-balance md:text-[22px]">
                  ไม่มีรถ
                </p>
              </div>
            ) : (
              vehicles.map((vehicle) => (
                <Link
                  key={vehicle.id}
                  to={`/vehicles/${vehicle.id}`}
                  className="mt-4 block w-full"
                >
                  <CarCard
                    bg="primary"
                    icon={<BrandIcons brand={vehicle.vehicleModel?.brand} />}
                    licensePlate={
                      vehicle.licensePlate
                        ? `${formatPlate(vehicle.licensePlate.plateNumber)} ${vehicle.licensePlate.province}`
                        : "ไม่ระบุทะเบียนรถ"
                    }
                    brand={getDisplayBrand(vehicle.vehicleModel)}
                    date={formatDateShort(vehicle.lastVisitAt)}
                  />
                </Link>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CustomerDetail;
