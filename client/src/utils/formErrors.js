// errors ซ้อนได้หลายชั้น (attributes.width, tireLots[0].quantity) จึงไล่หา message แรก
export const firstErrorMessage = (errors) => {
  if (!errors || typeof errors !== "object") return null;
  if (typeof errors.message === "string" && errors.message) {
    return errors.message;
  }

  for (const value of Object.values(errors)) {
    const found = firstErrorMessage(value);
    if (found) return found;
  }

  return null;
};
