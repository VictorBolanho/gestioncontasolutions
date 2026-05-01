export const DEFAULT_THEME = Object.freeze({
  nombreEmpresa: "ContaSolutions",
  nombreComercial: "ContaSolutions",
  nombreSistema: "GestorConta",
  eslogan: "Asesores & Consultores",
  colorPrimario: "#2D466B",
  colorSecundario: "#C5AA3C",
  colorAcento: "#D4BC55",
  colorFondo: "#F5F6F8",
  colorSuperficie: "#FFFFFF",
  colorBorde: "#E5E7EB",
  colorTextoPrincipal: "#1F2937",
  colorTextoSecundario: "#6B7280",
  colorSidebar: "#243A5A",
  colorExito: "#2F855A",
  colorPeligro: "#C53030",
  colorAdvertencia: "#DD6B20",
  colorInfo: "#2B6CB0"
});

export function createOrganizationTheme(overrides = {}) {
  return {
    ...DEFAULT_THEME,
    ...overrides
  };
}

