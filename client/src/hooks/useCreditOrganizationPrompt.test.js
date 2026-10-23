// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { useCreditOrganizationPrompt } from "@/hooks/useCreditOrganizationPrompt";
import { renderHook } from "@/test/renderHook";

const repairOf = (organizationType) => ({
  customer: { id: 1, name: "อบต.", organizationType },
});

describe("ถามประเภทลูกค้าก่อนลงเครดิต", () => {
  it("ลูกค้ายังไม่มีประเภท เปิดกล่องก่อน ตอบแล้วลงเครดิตต่อด้วยค่าเดิม", () => {
    const { result, act } = renderHook(
      useCreditOrganizationPrompt,
      repairOf(null),
    );
    const onResume = vi.fn();
    const onChanged = vi.fn();

    let asked;
    act(() => {
      asked = result.current.askBeforeCredit("CREDIT", true);
    });
    expect(asked).toBe(true);
    let props = result.current.dialogProps({ onResume, onChanged });
    expect(props.isOpen).toBe(true);
    expect(props.silent).toBe(true);

    act(() => props.onSaved("GOVERNMENT"));
    expect(onResume).toHaveBeenCalledWith(true);
    expect(onChanged).not.toHaveBeenCalled();
    expect(result.current.creditType()).toBe("GOVERNMENT");
    expect(result.current.askBeforeCredit("CREDIT", true)).toBe(false);
    props = result.current.dialogProps({ onResume, onChanged });
    expect(props.isOpen).toBe(false);
  });

  it("ปิดกล่องโดยไม่ตอบ ไม่ลงเครดิต และถามใหม่ครั้งหน้า", () => {
    const { result, act } = renderHook(
      useCreditOrganizationPrompt,
      repairOf(null),
    );
    act(() => result.current.askBeforeCredit("CREDIT", false));
    act(() => result.current.dialogProps({}).onClose());
    expect(result.current.dialogProps({}).isOpen).toBe(false);
    expect(result.current.dialogProps({}).silent).toBe(false);
    act(() => {
      expect(result.current.askBeforeCredit("CREDIT", false)).toBe(true);
    });
  });

  it("ไม่ถามเมื่อมีประเภทแล้วหรือไม่ได้ลงเครดิต", () => {
    const { result } = renderHook(
      useCreditOrganizationPrompt,
      repairOf("SHOP"),
    );
    expect(result.current.askBeforeCredit("CREDIT", false)).toBe(false);
    expect(result.current.askBeforeCredit("PAID", false)).toBe(false);
    expect(result.current.creditType()).toBe("SHOP");
  });

  it("เปลี่ยนประเภทเฉยๆ จำไว้ให้ปุ่มย้อนกลับ", () => {
    const { result, act } = renderHook(
      useCreditOrganizationPrompt,
      repairOf("SHOP"),
    );
    const onChanged = vi.fn();
    expect(result.current.changedType()).toBeUndefined();
    act(() => result.current.open());
    act(() => result.current.dialogProps({ onChanged }).onSaved(null));
    expect(onChanged).toHaveBeenCalledWith(null);
    expect(result.current.changedType()).toBeNull();
  });
});
