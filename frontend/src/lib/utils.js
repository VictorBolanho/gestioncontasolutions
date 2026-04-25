import clsx from "clsx";

export const cn = (...inputs) => clsx(inputs);

export const formatDate = (value, options = {}) => {
  if (!value) return "Sin fecha";

  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...options
  }).format(new Date(value));
};

export const formatPercent = (value) =>
  new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 1
  }).format(Number(value || 0));
