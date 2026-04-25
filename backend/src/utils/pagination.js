const buildPagination = ({ page, limit, total }) => {
  const currentPage = Number(page) || 1;
  const perPage = Number(limit) || 10;
  const totalPages = Math.ceil(total / perPage) || 1;

  return {
    page: currentPage,
    limit: perPage,
    total,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1
  };
};

module.exports = { buildPagination };
