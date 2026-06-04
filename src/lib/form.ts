/** Read a text field from `FormData`, coercing missing/file values to "". */
export function getFormString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
