import { getProductName } from "@/utils/billItems";

const ProductName = ({ item }) => (
  <p className="text-normal line-clamp-1 w-full text-base leading-tight font-semibold md:text-lg">
    {getProductName(item)}
  </p>
);

export default ProductName;
