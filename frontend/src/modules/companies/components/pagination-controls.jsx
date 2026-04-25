export function PaginationControls({ meta, onPageChange }) {
  if (!meta) return null;

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <p className="text-sm text-slate-500">
        Página <span className="font-bold text-brand-ink">{meta.page}</span> de{" "}
        <span className="font-bold text-brand-ink">{meta.totalPages}</span> · {meta.total} empresas
      </p>
      <div className="flex gap-2">
        <button type="button" className="button-secondary px-4 py-2 text-sm" disabled={!meta.hasPrevPage} onClick={() => onPageChange(meta.page - 1)}>
          Anterior
        </button>
        <button type="button" className="button-primary px-4 py-2 text-sm" disabled={!meta.hasNextPage} onClick={() => onPageChange(meta.page + 1)}>
          Siguiente
        </button>
      </div>
    </div>
  );
}
