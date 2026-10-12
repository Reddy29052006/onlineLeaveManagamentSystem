export function fieldErrors(details = []) {
  const map = {};
  for (const detail of details || []) {
    if (detail.field && !map[detail.field]) {
      map[detail.field] = detail.message;
    }
  }
  return map;
}