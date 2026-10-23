// ตัวช่วยเรนเดอร์ hook ในเทสต์ โดยไม่ต้องลงไลบรารีเพิ่ม
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

export const renderHook = (useHook, initialProps) => {
  const result = { current: null };
  let props = initialProps;
  const Probe = () => {
    result.current = useHook(props);
    return null;
  };
  const root = createRoot(document.createElement("div"));
  act(() => root.render(createElement(Probe)));
  return {
    result,
    rerender: (next) => {
      props = next;
      act(() => root.render(createElement(Probe)));
    },
    act: (fn) => act(fn),
  };
};
