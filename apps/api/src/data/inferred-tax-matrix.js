export const defaultInferredTaxRules = [
  {
    id: "matrix_rst_anticipo_regimen_simple",
    impuestoId: "tax_rst",
    nombreRegla: "RST anticipo bimestral detectado",
    descripcion: "Si la empresa declara regimen simple en el perfil confirmado, sugerir el anticipo bimestral del RST.",
    estado: "activo",
    accionSugerida: "sugerir",
    estadoInicial: "sugerida",
    fuenteDeteccion: "matriz_deducida_2026",
    eventoFiscalClave: "anticipo_bimestral",
    criterios: {
      regimenIncludesAny: ["simple"]
    }
  },
  {
    id: "matrix_rst_anual_regimen_simple",
    impuestoId: "tax_rst",
    nombreRegla: "RST declaracion anual consolidada",
    descripcion: "Si la empresa declara regimen simple en el perfil confirmado, sugerir la declaracion anual consolidada del RST.",
    estado: "activo",
    accionSugerida: "sugerir",
    estadoInicial: "sugerida",
    fuenteDeteccion: "matriz_deducida_2026",
    eventoFiscalClave: "declaracion_anual_consolidada",
    criterios: {
      regimenIncludesAny: ["simple"]
    }
  },
  {
    id: "matrix_rst_iva_regimen_simple",
    impuestoId: "tax_rst",
    nombreRegla: "RST consolidada anual de IVA",
    descripcion: "Si la empresa declara regimen simple y es responsable de IVA, sugerir la consolidada anual de IVA del RST.",
    estado: "activo",
    accionSugerida: "sugerir",
    estadoInicial: "sugerida",
    fuenteDeteccion: "matriz_deducida_2026",
    eventoFiscalClave: "consolidada_iva",
    criterios: {
      regimenIncludesAny: ["simple"],
      boolFlagsAny: ["responsableIva"]
    }
  },
  {
    id: "matrix_rub_persona_juridica",
    impuestoId: "tax_rub",
    nombreRegla: "Persona juridica con posible obligacion RUB",
    descripcion: "Las personas juridicas suelen requerir validacion de reporte o actualizacion de beneficiarios finales.",
    estado: "activo",
    accionSugerida: "sugerir",
    estadoInicial: "pendiente_revision",
    fuenteDeteccion: "matriz_deducida_2026",
    criterios: {
      tipoPersonaIn: ["juridica", "persona juridica"]
    }
  },
  {
    id: "matrix_iva_por_flag",
    impuestoId: "tax_iva",
    nombreRegla: "Responsable IVA por perfil confirmado",
    descripcion: "Si el perfil confirmado marca responsable IVA, sugerir IVA aunque no exista codigo RUT normalizado.",
    estado: "activo",
    accionSugerida: "sugerir",
    estadoInicial: "sugerida",
    fuenteDeteccion: "matriz_deducida_2026",
    criterios: {
      boolFlagsAny: ["responsableIva"]
    }
  },
  {
    id: "matrix_facturacion_por_flag",
    impuestoId: "tax_facturacion_electronica",
    nombreRegla: "Facturacion por perfil operativo",
    descripcion: "Si la empresa aparece como obligada a facturar, sugerir facturacion electronica.",
    estado: "activo",
    accionSugerida: "sugerir",
    estadoInicial: "sugerida",
    fuenteDeteccion: "matriz_deducida_2026",
    criterios: {
      boolFlagsAny: ["obligadoFacturar"]
    }
  },
  {
    id: "matrix_contabilidad_por_flag",
    impuestoId: "tax_contabilidad",
    nombreRegla: "Contabilidad por perfil confirmado",
    descripcion: "Si la empresa aparece obligada a llevar contabilidad, sugerir obligacion contable.",
    estado: "activo",
    accionSugerida: "sugerir",
    estadoInicial: "sugerida",
    fuenteDeteccion: "matriz_deducida_2026",
    criterios: {
      boolFlagsAny: ["obligadoLlevarContabilidad"]
    }
  },
  {
    id: "matrix_exogena_por_flag",
    impuestoId: "tax_exogena",
    nombreRegla: "Exogena por perfil confirmado",
    descripcion: "Si el perfil confirmado marca informante exogena, sugerir exogena aunque el RUT venga incompleto.",
    estado: "activo",
    accionSugerida: "sugerir",
    estadoInicial: "sugerida",
    fuenteDeteccion: "matriz_deducida_2026",
    criterios: {
      boolFlagsAny: ["informanteExogena"]
    }
  },
  {
    id: "matrix_beneficiarios_por_flag",
    impuestoId: "tax_beneficiarios_finales",
    nombreRegla: "Beneficiarios finales por perfil confirmado",
    descripcion: "Si el perfil confirmado marca informante de beneficiarios finales, sugerir la obligacion correspondiente.",
    estado: "activo",
    accionSugerida: "sugerir",
    estadoInicial: "sugerida",
    fuenteDeteccion: "matriz_deducida_2026",
    criterios: {
      boolFlagsAny: ["informanteBeneficiariosFinales"]
    }
  },
  {
    id: "matrix_inc_restaurantes",
    impuestoId: "tax_consumo",
    nombreRegla: "Consumo potencial por restaurantes y bares",
    descripcion: "CIIU de restaurantes, expendio de comidas o bebidas puede requerir validacion de INC.",
    estado: "activo",
    accionSugerida: "sugerir",
    estadoInicial: "pendiente_revision",
    fuenteDeteccion: "matriz_deducida_2026",
    criterios: {
      ciiuPrefixes: ["561", "562", "563"]
    }
  },
  {
    id: "matrix_gasolina_sector_combustibles",
    impuestoId: "tax_gasolina_acpm",
    nombreRegla: "Sector combustibles",
    descripcion: "Empresas del sector combustibles pueden requerir obligaciones de gasolina y ACPM.",
    estado: "activo",
    accionSugerida: "sugerir",
    estadoInicial: "pendiente_revision",
    fuenteDeteccion: "matriz_deducida_2026",
    criterios: {
      ciiuPrefixes: ["4731", "1921", "4661", "4662"]
    }
  },
  {
    id: "matrix_carbono_sector_combustibles",
    impuestoId: "tax_carbono",
    nombreRegla: "Carbono por cadena de combustibles",
    descripcion: "Empresas del sector combustibles o energia pueden requerir validacion del impuesto al carbono.",
    estado: "activo",
    accionSugerida: "sugerir",
    estadoInicial: "pendiente_revision",
    fuenteDeteccion: "matriz_deducida_2026",
    criterios: {
      ciiuPrefixes: ["4731", "1921", "4661", "4662"]
    }
  },
  {
    id: "matrix_plasticos_industria",
    impuestoId: "tax_plasticos",
    nombreRegla: "Plasticos por manufactura potencial",
    descripcion: "Manufactura de plasticos y empaques puede requerir validacion del impuesto a plasticos de un solo uso.",
    estado: "activo",
    accionSugerida: "sugerir",
    estadoInicial: "pendiente_revision",
    fuenteDeteccion: "matriz_deducida_2026",
    criterios: {
      ciiuPrefixes: ["2221", "2229"]
    }
  },
  {
    id: "matrix_ultraprocesados_alimentos",
    impuestoId: "tax_ultraprocesados",
    nombreRegla: "Ultraprocesados por alimentos y bebidas",
    descripcion: "Fabricacion de alimentos o bebidas puede requerir validacion de impuestos saludables.",
    estado: "activo",
    accionSugerida: "sugerir",
    estadoInicial: "pendiente_revision",
    fuenteDeteccion: "matriz_deducida_2026",
    criterios: {
      ciiuPrefixes: ["108", "1104", "1107"]
    }
  }
];
