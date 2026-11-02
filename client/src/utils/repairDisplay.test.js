import { describe, expect, it } from "vitest";
import { getRepairTitle } from "@/utils/repairDisplay";

const serviceBill = (repairItems) => ({
  type: "GENERAL",
  vehicle: null,
  repairItems,
});

describe("หัวการ์ดงานบริการ", () => {
  it("มีแต่งานที่รู้จัก ขึ้นชื่องาน", () => {
    expect(
      getRepairTitle(
        serviceBill([
          { itemName: "ปะยาง", partId: null },
          { itemName: "จุ๊บลม", partId: null },
        ]),
      ),
    ).toBe("ปะยาง + จุ๊บลม");
  });

  it("มีอะไหล่จากสต็อกปน ขึ้นว่างานบริการ", () => {
    expect(
      getRepairTitle(
        serviceBill([
          { itemName: "BRIDGESTONE 215/70R15 DURAVIS R611", partId: 12 },
          { itemName: "จุ๊บลม", partId: null },
        ]),
      ),
    ).toBe("งานบริการ");
  });
});
