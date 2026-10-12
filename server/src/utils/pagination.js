const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export function parsePagination(query = {}, options = {}) {
  const defaultLimit = options.defaultLimit ?? DEFAULT_LIMIT;
  const maxLimit = options.maxLimit ?? MAX_LIMIT;

  const rawPage = Number.parseInt(query.page, 10);
  const rawLimit = Number.parseInt(query.limit, 10);

  const page = Number.isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
  const limit = Number.isNaN(rawLimit)
    ? defaultLimit
    : Math.min(Math.max(rawLimit, 1), maxLimit);

  return { page, limit, skip: (page - 1) * limit };
}

export function buildPaginationMeta({ page, limit, total }) {
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;
  return { page, limit, total, totalPages };
}
