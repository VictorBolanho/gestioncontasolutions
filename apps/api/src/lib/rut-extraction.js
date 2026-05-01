import { PDFParse } from "pdf-parse";
import { enrichEconomicActivity, EXTRACTION_STATUS } from "../../../../packages/domain/index.js";

const NO_TEXT_MESSAGE = "No se pudo extraer texto legible del PDF. Revisa los datos manualmente.";
const RUT_SOURCE = "rut_pdf";
const DERIVED_SOURCE = "deducido_sistema";

function normalizeField(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function squashAccentless(value) {
  return normalizeField(value)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function normalizeRutText(text) {
  return String(text || "")
    .replace(/\u0000/g, " ")
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/--\s*\d+\s+of\s+\d+\s*--/gi, "")
    .trim();
}

export function compactDigitGroups(text) {
  return String(text || "").replace(/(?:\d\s+){2,}\d/g, (match) => match.replace(/\s+/g, ""));
}

function isLikelyLabelLine(line) {
  const compact = squashAccentless(line);
  return (
    /^\d{1,3}\./.test(line) ||
    compact.includes("numero de identificacion tributaria") ||
    compact.includes("razon social") ||
    compact.includes("direccion principal") ||
    compact.includes("correo electronico") ||
    compact.includes("responsabilidades, calidades y atributos") ||
    compact === "identificacion" ||
    compact === "ubicacion" ||
    compact === "clasificacion" ||
    compact === "actividad economica" ||
    compact === "representacion"
  );
}

function lineList(text) {
  return normalizeRutText(text)
    .split("\n")
    .map((line) => normalizeField(line))
    .filter(Boolean);
}

function annotateField(valor, fuente = RUT_SOURCE, confianza = "media", requiereRevision = false) {
  return {
    valor: valor ?? "",
    fuente,
    confianza,
    requiereRevision
  };
}

function setField(result, fieldMetadata, fieldName, value, options = {}) {
  const normalizedValue = Array.isArray(value)
    ? value
    : typeof value === "boolean"
      ? value
      : normalizeField(value);

  result[fieldName] = normalizedValue;
  fieldMetadata[fieldName] = annotateField(
    normalizedValue,
    options.fuente || RUT_SOURCE,
    options.confianza || (normalizedValue ? "media" : "baja"),
    options.requiereRevision ?? !normalizedValue
  );
}

function firstNonEmpty(values) {
  return values.find((value) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }

    if (typeof value === "boolean") {
      return true;
    }

    return normalizeField(value).length > 0;
  });
}

function safeIsoDate(year, month, day) {
  const yyyy = Number(year);
  const mm = Number(month);
  const dd = Number(day);

  if (!Number.isInteger(yyyy) || !Number.isInteger(mm) || !Number.isInteger(dd)) {
    return "";
  }

  if (yyyy < 1900 || yyyy > 2100 || mm < 1 || mm > 12 || dd < 1 || dd > 31) {
    return "";
  }

  return `${String(yyyy).padStart(4, "0")}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
}

export function extractDateFromDigitSequence(value) {
  const source = normalizeField(value);
  if (!source) {
    return "";
  }

  const isoDirect = source.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (isoDirect) {
    return safeIsoDate(isoDirect[1], isoDirect[2], isoDirect[3]);
  }

  const slashOrDash = source.match(/\b(\d{2})[/-](\d{2})[/-](\d{4})\b/);
  if (slashOrDash) {
    return safeIsoDate(slashOrDash[3], slashOrDash[2], slashOrDash[1]);
  }

  const digits = source.replace(/\D/g, "");
  if (digits.length < 8) {
    return "";
  }

  for (let index = 0; index <= digits.length - 8; index += 1) {
    const chunk = digits.slice(index, index + 8);

    if (/^(19|20)\d{6}$/.test(chunk)) {
      const isoDate = safeIsoDate(chunk.slice(0, 4), chunk.slice(4, 6), chunk.slice(6, 8));
      if (isoDate) {
        return isoDate;
      }
    }

    const ddmmyyyy = safeIsoDate(chunk.slice(4, 8), chunk.slice(2, 4), chunk.slice(0, 2));
    if (ddmmyyyy) {
      return ddmmyyyy;
    }
  }

  return "";
}

function parseTextSegmentsFromGeographyLine(line) {
  const tokens = normalizeField(line).split(/\s+/);
  const segments = [];
  let current = [];

  for (const token of tokens) {
    if (/^\d+$/.test(token)) {
      if (current.length) {
        segments.push(current.join(" "));
        current = [];
      }
      continue;
    }

    current.push(token);
  }

  if (current.length) {
    segments.push(current.join(" "));
  }

  return segments.map((segment) => normalizeField(segment.replace(/\s+,/g, ",")));
}

function findLineIndex(lines, matcher) {
  return lines.findIndex((line) => {
    if (matcher instanceof RegExp) {
      return matcher.test(line);
    }

    return squashAccentless(line).includes(squashAccentless(matcher));
  });
}

function findFirstCandidateAfter(lines, startIndex, predicate, maxDistance = 6) {
  if (startIndex < 0) {
    return "";
  }

  for (let offset = 1; offset <= maxDistance; offset += 1) {
    const line = lines[startIndex + offset];
    if (!line) {
      break;
    }

    if (predicate(line, startIndex + offset)) {
      return line;
    }
  }

  return "";
}

function valueFromSameLine(line, labelPattern) {
  const match = line.match(labelPattern);
  if (!match) {
    return "";
  }

  const value = normalizeField(line.slice(match.index + match[0].length));
  return value.replace(/^[:.\-]+/, "").trim();
}

export function extractFieldAfterLabel(text, labelPatterns) {
  const lines = lineList(text);
  const patterns = Array.isArray(labelPatterns) ? labelPatterns : [labelPatterns];

  for (const pattern of patterns) {
    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern, "i");
    const index = lines.findIndex((line) => regex.test(line));

    if (index === -1) {
      continue;
    }

    const sameLineValue = valueFromSameLine(lines[index], regex);
    if (sameLineValue && !isLikelyLabelLine(sameLineValue)) {
      return sameLineValue;
    }

    const nextValue = findFirstCandidateAfter(
      lines,
      index,
      (line) => !isLikelyLabelLine(line) && !/^(si|no|hoja\s+\d+|pagina)/i.test(line)
    );

    if (nextValue) {
      return nextValue;
    }
  }

  return "";
}

function cleanMojibake(value) {
  return normalizeField(
    String(value || "")
      .replace(/jurÃ­dica/gi, "juridica")
      .replace(/BogotÃ¡/gi, "Bogota")
      .replace(/electrÃ³nico/gi, "electronico")
      .replace(/RazÃ³n/gi, "Razon")
      .replace(/CÃ©dula/gi, "Cedula")
      .replace(/RetenciÃ³n/gi, "Retencion")
      .replace(/ObligaciÃ³n/gi, "Obligacion")
      .replace(/rÃ©gimen/gi, "regimen")
  );
}

function cleanRepresentativeName(name) {
  return normalizeField(cleanMojibake(name).replace(/\bREPRESENTANTE\b.*$/i, ""));
}

function splitPersonName(fullName) {
  const tokens = cleanRepresentativeName(fullName).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) {
    return {
      primerApellido: "",
      segundoApellido: "",
      primerNombre: "",
      otrosNombres: "",
      nombreCompleto: ""
    };
  }

  const primerApellido = tokens[0] || "";
  const segundoApellido = tokens[1] || "";
  const primerNombre = tokens[2] || "";
  const otrosNombres = tokens.slice(3).join(" ");

  return {
    primerApellido,
    segundoApellido,
    primerNombre,
    otrosNombres,
    nombreCompleto: normalizeField([primerApellido, segundoApellido, primerNombre, otrosNombres].filter(Boolean).join(" "))
  };
}

export function extractNitAndDv(text) {
  const lines = lineList(text);

  const labeledNit = firstNonEmpty([
    normalizeField((normalizeRutText(text).match(/\bNIT\b[:\s-]*([0-9 .]{6,20})/i) || [])[1]),
    normalizeField((normalizeRutText(text).match(/5\.\s*Numero de Identificacion Tributaria\s*\(NIT\)\s*([0-9 .]{6,20})/i) || [])[1])
  ]);
  const labeledDv = normalizeField((normalizeRutText(text).match(/\bDV\b[:\s-]*([0-9])\b/i) || [])[1]);

  if (labeledNit && labeledDv) {
    return {
      nit: labeledNit.replace(/\D/g, ""),
      dv: labeledDv.replace(/\D/g, ""),
      sourceLine: ""
    };
  }

  const candidateLine =
    lines.find((line) => /impuestos de|direccion seccional/i.test(line) && /(?:\d\s*){8,}/.test(line)) ||
    lines.find((line) => /^[\d\s]{8,}\s+[A-Za-z]/.test(line));

  if (!candidateLine) {
    return { nit: "", dv: "", sourceLine: "" };
  }

  const firstAlphaIndex = candidateLine.search(/[A-Za-z]/);
  const prefix = firstAlphaIndex > 0 ? candidateLine.slice(0, firstAlphaIndex) : candidateLine;
  const digits = prefix.replace(/\D/g, "");

  if (digits.length < 2) {
    return { nit: "", dv: "", sourceLine: candidateLine };
  }

  return {
    nit: digits.slice(0, -1),
    dv: digits.slice(-1),
    sourceLine: candidateLine
  };
}

function extractDireccionSeccional(identityLine) {
  if (!identityLine) {
    return "";
  }

  const withoutLeadingDigits = normalizeField(identityLine.replace(/^[\d\s]+/, ""));
  const withoutTrailingDigits = normalizeField(withoutLeadingDigits.replace(/\s+\d+(?:\s+\d+)*$/, ""));
  return cleanMojibake(withoutTrailingDigits);
}

function extractBuzonElectronico(identityLine) {
  const trailingDigits = normalizeField((identityLine.match(/[A-Za-z].*?(\d(?:\s+\d+)*)$/) || [])[1]);
  const compact = trailingDigits.replace(/\D/g, "");
  if (!compact || compact.length > 6) {
    return "";
  }

  return compact;
}

function extractActivityPayload(lines, emailIndex) {
  const startIndex = emailIndex >= 0 ? emailIndex + 1 : 0;
  const candidates = [];

  for (let index = startIndex; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^\d{2}\s*-\s*/.test(line)) {
      break;
    }

    const digits = line.replace(/\D/g, "");
    if (digits.length >= 12) {
      candidates.push({ line, digits, index });
    }
  }

  return candidates.at(-1) || { line: "", digits: "", index: -1 };
}

function parseActivityDigits(digits) {
  const payload = {
    actividadEconomicaPrincipal: "",
    fechaInicioActividadPrincipal: "",
    actividadEconomicaSecundaria: "",
    fechaInicioActividadSecundaria: "",
    otrasActividades: "",
    numeroEstablecimientos: ""
  };

  if (!digits || digits.length < 12) {
    return payload;
  }

  payload.actividadEconomicaPrincipal = digits.slice(0, 4);
  payload.fechaInicioActividadPrincipal = extractDateFromDigitSequence(digits.slice(4, 12));

  let cursor = 12;
  if (digits.length >= cursor + 12) {
    payload.actividadEconomicaSecundaria = digits.slice(cursor, cursor + 4);
    payload.fechaInicioActividadSecundaria = extractDateFromDigitSequence(digits.slice(cursor + 4, cursor + 12));
    cursor += 12;
  }

  const remaining = digits.slice(cursor);
  if (remaining.length >= 4) {
    const activityCodes = [];

    for (let position = 0; position + 4 <= remaining.length; position += 4) {
      const code = remaining.slice(position, position + 4);
      if (/^\d{4}$/.test(code)) {
        activityCodes.push(code);
      }
    }

    if (activityCodes.length) {
      payload.otrasActividades = activityCodes.join(", ");
    }
  } else if (remaining.length > 0 && remaining.length <= 3) {
    payload.numeroEstablecimientos = remaining;
  }

  if (!payload.numeroEstablecimientos && remaining.length > 0 && remaining.length <= 3) {
    payload.numeroEstablecimientos = remaining;
  }

  return payload;
}

function parseContactDigits(digits) {
  const payload = {
    codigoPostal: "",
    telefono1: "",
    telefono2: ""
  };

  if (!digits) {
    return payload;
  }

  if (digits.length >= 6) {
    payload.codigoPostal = digits.slice(0, 6);
  }

  if (digits.length >= 16) {
    payload.telefono1 = digits.slice(6, 16);
  }

  if (digits.length >= 26) {
    payload.telefono2 = digits.slice(16, 26);
  }

  return payload;
}

export function extractResponsibilities(text) {
  const lines = lineList(text);
  const items = [];
  const seen = new Set();

  for (const line of lines) {
    const normalizedLine = cleanMojibake(line);
    const explicitMatch = normalizedLine.match(/^(\d{2})\s*-\s*(.+)$/i);
    if (explicitMatch) {
      const codigo = explicitMatch[1];
      const nombre = normalizeField(explicitMatch[2]);
      const uniqueKey = `${codigo}:${nombre.toLowerCase()}`;
      if (!seen.has(uniqueKey)) {
        seen.add(uniqueKey);
        items.push({
          codigo,
          nombre,
          fuenteTexto: line
        });
      }
      continue;
    }

    if (!/responsabilidades tributarias/i.test(normalizedLine)) {
      continue;
    }

    const tail = normalizedLine.replace(/^.*responsabilidades tributarias/i, "").trim();
    const segments = tail.split(/[;|]+/).map((segment) => segment.trim()).filter(Boolean);
    for (const segment of segments) {
      const inlineMatch = segment.match(/^(\d{2})\s*-?\s*(.+)$/i);
      if (!inlineMatch) {
        continue;
      }

      const codigo = inlineMatch[1];
      const nombre = normalizeField(inlineMatch[2]);
      const uniqueKey = `${codigo}:${nombre.toLowerCase()}`;
      if (seen.has(uniqueKey)) {
        continue;
      }

      seen.add(uniqueKey);
      items.push({
        codigo,
        nombre,
        fuenteTexto: segment
      });
    }
  }

  return items;
}

export function deriveTaxFlags(responsibilities) {
  const codes = new Set((responsibilities || []).map((item) => String(item.codigo)));
  return {
    responsableIva: codes.has("48"),
    obligadoLlevarContabilidad: codes.has("42"),
    obligadoFacturar: codes.has("16") || codes.has("52"),
    informanteExogena: codes.has("14"),
    agenteRetencionFuente: codes.has("07") || codes.has("09"),
    informanteBeneficiariosFinales: codes.has("55")
  };
}

export function deriveTipoPersona(tipoContribuyente) {
  const normalized = squashAccentless(tipoContribuyente);
  if (normalized.includes("persona juridica")) {
    return "Juridica";
  }

  if (normalized.includes("persona natural")) {
    return "Natural";
  }

  return "Pendiente de revision";
}

export function deriveRegimenTributario(responsibilities) {
  const items = responsibilities || [];
  const codes = new Set(items.map((item) => String(item.codigo)));
  const names = items.map((item) => squashAccentless(item.nombre));

  if (codes.has("05")) {
    return {
      regimenTributario: "Regimen ordinario",
      regimenTributarioFuente: "responsabilidad_05",
      requiereRevisionRegimen: false
    };
  }

  if (names.some((name) => name.includes("simple"))) {
    return {
      regimenTributario: "Regimen simple de tributacion",
      regimenTributarioFuente: "responsabilidad_simple",
      requiereRevisionRegimen: false
    };
  }

  if (names.some((name) => name.includes("especial"))) {
    return {
      regimenTributario: "Regimen especial",
      regimenTributarioFuente: "responsabilidad_especial",
      requiereRevisionRegimen: false
    };
  }

  return {
    regimenTributario: "Pendiente de revision",
    regimenTributarioFuente: "",
    requiereRevisionRegimen: true
  };
}

function normalizeDocumentType(value) {
  const normalized = squashAccentless(value);

  if (normalized.includes("cedula de ciudadania")) {
    return "Cedula de ciudadania";
  }

  if (normalized.includes("nit")) {
    return "NIT";
  }

  if (normalized.includes("pasaporte")) {
    return "Pasaporte";
  }

  return cleanMojibake(value);
}

export function extractLegalRepresentative(text) {
  const lines = lineList(text);

  for (let index = 0; index < lines.length; index += 1) {
    const currentLine = cleanMojibake(lines[index]);

    if (/^\d{1,3}\./.test(currentLine)) {
      continue;
    }

    if (!/reprs legal|representante legal|legal prin/i.test(currentLine)) {
      continue;
    }

    if (/razon social representante legal|tipo de documento|fecha inicio ejercicio representacion/i.test(currentLine)) {
      continue;
    }

    const date = extractDateFromDigitSequence(currentLine);
    const type = normalizeField(currentLine.replace(/[\d\s/-]+.*$/, "")) || "Representacion";
    const documentLine = lines[index + 1] || "";
    const nameLine = lines[index + 2] || "";
    const documentType = normalizeDocumentType(documentLine.replace(/[\d\s]+$/, ""));
    const documentDigits = documentLine.replace(/\D/g, "");
    const dv = documentDigits.length > 9 ? documentDigits.slice(-1) : "";
    const numeroIdentificacion = documentDigits.length > 9 ? documentDigits.slice(0, -1) : documentDigits;
    const parsedName = splitPersonName(nameLine);

    const representativeIsReliable =
      parsedName.nombreCompleto &&
      /^[A-ZÁÉÍÓÚÜÑ\s]+$/i.test(nameLine) &&
      (documentDigits.length === 0 || (documentDigits.length >= 6 && documentDigits.length <= 10));

    if (representativeIsReliable) {
      return {
        tipoRepresentacion: normalizeField(type),
        fechaInicioRepresentacion: date,
        tipoDocumento: documentType,
        numeroIdentificacion,
        dv,
        ...parsedName
      };
    }
  }

  const certifiedIndex = lines.findIndex((line) => /representante legal certificado/i.test(line));
  if (certifiedIndex > 0) {
    const rawName = lines[certifiedIndex - 1];
    const parsedName = splitPersonName(rawName);

    if (parsedName.nombreCompleto) {
      return {
        tipoRepresentacion: "Representante legal certificado",
        fechaInicioRepresentacion: "",
        tipoDocumento: "",
        numeroIdentificacion: "",
        dv: "",
        ...parsedName
      };
    }
  }

  return {
    tipoRepresentacion: "",
    fechaInicioRepresentacion: "",
    tipoDocumento: "",
    numeroIdentificacion: "",
    dv: "",
    primerApellido: "",
    segundoApellido: "",
    primerNombre: "",
    otrosNombres: "",
    nombreCompleto: ""
  };
}

export function calculateExtractionConfidence(result) {
  const criticalFields = ["nit", "dv", "razonSocial", "tipoContribuyente"];
  const supportingFields = [
    "direccionSeccional",
    "pais",
    "departamento",
    "municipio",
    "direccionPrincipal",
    "correoElectronico",
    "actividadEconomicaPrincipal",
    "fechaGeneracionRut",
    "numeroFormulario"
  ];

  const criticalScore = criticalFields.filter((field) => normalizeField(result[field])).length;
  const supportingScore = supportingFields.filter((field) => normalizeField(result[field])).length;
  const percentage = Math.round(((criticalScore * 2 + supportingScore) / (criticalFields.length * 2 + supportingFields.length)) * 100);

  return {
    criticalScore,
    supportingScore,
    percentage
  };
}

function buildDefaultExtractionData() {
  return {
    numeroFormulario: "",
    concepto: "",
    nit: "",
    dv: "",
    direccionSeccional: "",
    buzonElectronico: "",
    tipoContribuyente: "",
    tipoPersona: "Pendiente de revision",
    tipoDocumento: "",
    numeroIdentificacion: "",
    razonSocial: "",
    nombreComercial: "",
    sigla: "",
    pais: "",
    departamento: "",
    municipio: "",
    direccionPrincipal: "",
    correoElectronico: "",
    email: "",
    codigoPostal: "",
    telefono1: "",
    telefono2: "",
    actividadEconomicaPrincipal: "",
    actividadEconomicaPrincipalCodigo: "",
    actividadEconomicaPrincipalNombre: "",
    actividadEconomicaPrincipalFuente: "",
    fechaInicioActividadPrincipal: "",
    actividadEconomicaSecundaria: "",
    fechaInicioActividadSecundaria: "",
    otrasActividades: "",
    numeroEstablecimientos: "",
    responsabilidadesTributarias: [],
    responsableIva: false,
    obligadoLlevarContabilidad: false,
    obligadoFacturar: false,
    informanteExogena: false,
    agenteRetencionFuente: false,
    informanteBeneficiariosFinales: false,
    regimenTributario: "Pendiente de revision",
    regimenTributarioFuente: "",
    requiereRevisionRegimen: true,
    representanteLegalPrincipal: {
      tipoRepresentacion: "",
      fechaInicioRepresentacion: "",
      tipoDocumento: "",
      numeroIdentificacion: "",
      dv: "",
      primerApellido: "",
      segundoApellido: "",
      primerNombre: "",
      otrosNombres: "",
      nombreCompleto: ""
    },
    fechaGeneracionRut: "",
    paginasDetectadas: 0,
    textoExtraidoPreview: ""
  };
}

function inferExtractionStatus(result) {
  const criticalFields = [result.nit, result.dv, result.razonSocial, result.tipoContribuyente].filter((value) => normalizeField(value));
  const partialFields = [result.nit, result.dv, result.razonSocial].filter((value) => normalizeField(value));

  if (criticalFields.length === 4) {
    return EXTRACTION_STATUS.SUCCESS;
  }

  if (partialFields.length === 3) {
    return EXTRACTION_STATUS.PARTIAL;
  }

  return EXTRACTION_STATUS.REQUIRES_REVIEW;
}

function extractGenericRutData(text, pagesDetected) {
  const result = buildDefaultExtractionData();
  const fieldMetadata = {};
  const lines = lineList(text);
  const flattenedText = normalizeRutText(text);

  setField(result, fieldMetadata, "numeroFormulario", firstNonEmpty([
    extractFieldAfterLabel(flattenedText, [/4\.\s*Numero de formulario/i]),
    lines.find((line) => /^\d{10,14}$/.test(line)) || ""
  ]), { confianza: "alta" });

  setField(result, fieldMetadata, "concepto", firstNonEmpty([
    (() => {
      const classificationIndex = findLineIndex(lines, "CLASIFICACION");
      if (classificationIndex < 0) {
        return "";
      }
      const line = lines[classificationIndex + 1] || "";
      const cleaned = normalizeField(cleanMojibake(line).replace(/\d+/g, ""));
      return isLikelyLabelLine(cleaned) ? "" : cleaned;
    })(),
    (() => {
      const labeled = extractFieldAfterLabel(flattenedText, [/2\.\s*Concepto/i]);
      return isLikelyLabelLine(labeled) ? "" : labeled;
    })()
  ]), { confianza: "media", requiereRevision: false });

  const identity = extractNitAndDv(flattenedText);
  setField(result, fieldMetadata, "nit", identity.nit, { confianza: identity.nit ? "alta" : "baja" });
  setField(result, fieldMetadata, "dv", identity.dv, { confianza: identity.dv ? "alta" : "baja" });

  const identityLine = identity.sourceLine;
  setField(result, fieldMetadata, "direccionSeccional", firstNonEmpty([
    extractDireccionSeccional(identityLine),
    extractFieldAfterLabel(flattenedText, [/12\.\s*Direccion seccional/i])
  ]), { confianza: "media" });

  setField(result, fieldMetadata, "buzonElectronico", firstNonEmpty([
    extractFieldAfterLabel(flattenedText, [/14\.\s*Buzon electronico/i]),
    extractBuzonElectronico(identityLine)
  ]), { confianza: "baja", requiereRevision: true });

  const typeLine =
    findFirstCandidateAfter(
      lines,
      lines.findIndex((line) => line === identityLine),
      (line) => /persona\s+juridica|persona\s+natural/i.test(squashAccentless(line))
    ) ||
    extractFieldAfterLabel(flattenedText, [/24\.\s*Tipo de contribuyente/i, /Tipo de contribuyente/i]);
  const tipoContribuyente = cleanMojibake(typeLine).replace(/\s+\d+(?:\s+\d+)*$/, "");
  setField(result, fieldMetadata, "tipoContribuyente", tipoContribuyente, { confianza: tipoContribuyente ? "alta" : "baja" });

  const tipoPersona = deriveTipoPersona(tipoContribuyente);
  setField(result, fieldMetadata, "tipoPersona", tipoPersona, {
    fuente: DERIVED_SOURCE,
    confianza: tipoPersona === "Pendiente de revision" ? "baja" : "alta",
    requiereRevision: tipoPersona === "Pendiente de revision"
  });

  setField(result, fieldMetadata, "tipoDocumento", firstNonEmpty([
    extractFieldAfterLabel(flattenedText, [/25\.\s*Tipo de documento/i]),
    ""
  ]), { confianza: "baja", requiereRevision: true });

  setField(result, fieldMetadata, "numeroIdentificacion", firstNonEmpty([
    extractFieldAfterLabel(flattenedText, [/26\.\s*Numero de Identificacion/i]),
    ""
  ]), { confianza: "baja", requiereRevision: true });

  const razonSocialIndex = lines.findIndex((line) => squashAccentless(line).startsWith(squashAccentless(tipoContribuyente)));
  const razonSocial = firstNonEmpty([
    razonSocialIndex >= 0 ? lines[razonSocialIndex + 1] || "" : "",
    (() => {
      const labeled = extractFieldAfterLabel(flattenedText, [/35\.\s*Razon social/i, /Razon social/i]);
      return /^nit\b/i.test(labeled) ? "" : labeled;
    })()
  ]);
  setField(result, fieldMetadata, "razonSocial", cleanMojibake(razonSocial), { confianza: razonSocial ? "alta" : "baja" });

  const nombreComercial = extractFieldAfterLabel(flattenedText, [/36\.\s*Nombre comercial/i, /Nombre comercial/i]);
  setField(result, fieldMetadata, "nombreComercial", cleanMojibake(nombreComercial), {
    confianza: nombreComercial ? "media" : "baja",
    requiereRevision: false
  });

  const sigla = extractFieldAfterLabel(flattenedText, [/37\.\s*Sigla/i, /\bSigla\b/i]);
  setField(result, fieldMetadata, "sigla", cleanMojibake(sigla), {
    confianza: sigla ? "media" : "baja",
    requiereRevision: false
  });

  const razonIndex = lines.findIndex((line) => line === razonSocial);
  const geographyLine =
    findFirstCandidateAfter(lines, razonIndex, (line) => /colombia|argentina|mexico|peru|ecuador|chile/i.test(cleanMojibake(line)), 4) ||
    extractFieldAfterLabel(flattenedText, [/38\.\s*Pais/i]);
  const geographySegments = parseTextSegmentsFromGeographyLine(geographyLine);

  setField(result, fieldMetadata, "pais", cleanMojibake(geographySegments[0] || ""), { confianza: geographySegments[0] ? "alta" : "baja" });
  setField(result, fieldMetadata, "departamento", cleanMojibake(geographySegments[1] || extractFieldAfterLabel(flattenedText, [/39\.\s*Departamento/i])), {
    confianza: geographySegments[1] ? "media" : "baja"
  });
  setField(result, fieldMetadata, "municipio", cleanMojibake(geographySegments[2] || extractFieldAfterLabel(flattenedText, [/40\.\s*Ciudad\/Municipio/i])), {
    confianza: geographySegments[2] ? "media" : "baja"
  });

  const geographyIndex = lines.findIndex((line) => line === geographyLine);
  const direccionPrincipal = firstNonEmpty([
    findFirstCandidateAfter(
      lines,
      geographyIndex,
      (line) => !/@/.test(line) && !/^\d(?:\s*\d){10,}$/.test(line) && !/^\d{2}\s*-\s*/.test(line)
    ),
    extractFieldAfterLabel(flattenedText, [/41\.\s*Direccion principal/i])
  ]);
  setField(result, fieldMetadata, "direccionPrincipal", cleanMojibake(direccionPrincipal), {
    confianza: direccionPrincipal ? "media" : "baja"
  });

  const email = firstNonEmpty([
    normalizeField((flattenedText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i) || [])[0]),
    extractFieldAfterLabel(flattenedText, [/42\.\s*Correo electronico/i, /Correo electronico/i])
  ]);
  setField(result, fieldMetadata, "correoElectronico", email, { confianza: email ? "alta" : "baja" });
  setField(result, fieldMetadata, "email", email, { confianza: email ? "alta" : "baja" });

  const emailIndex = lines.findIndex((line) => line.includes(email));
  const contactDigitsLine = emailIndex >= 0 ? normalizeField(lines[emailIndex + 1] || "") : "";
  const contactData = parseContactDigits(contactDigitsLine.replace(/\D/g, ""));
  setField(result, fieldMetadata, "codigoPostal", firstNonEmpty([
    contactData.codigoPostal,
    extractFieldAfterLabel(flattenedText, [/43\.\s*Codigo postal/i])
  ]), { confianza: contactData.codigoPostal ? "media" : "baja", requiereRevision: false });
  setField(result, fieldMetadata, "telefono1", firstNonEmpty([
    contactData.telefono1,
    extractFieldAfterLabel(flattenedText, [/44\.\s*Telefono 1/i])
  ]), { confianza: contactData.telefono1 ? "media" : "baja", requiereRevision: false });
  setField(result, fieldMetadata, "telefono2", firstNonEmpty([
    contactData.telefono2,
    extractFieldAfterLabel(flattenedText, [/45\.\s*Telefono 2/i])
  ]), { confianza: contactData.telefono2 ? "media" : "baja", requiereRevision: false });

  const activityPayload = extractActivityPayload(lines, emailIndex);
  const activityData = parseActivityDigits(activityPayload.digits);
  const actividadPrincipalCodigo = firstNonEmpty([
    activityData.actividadEconomicaPrincipal,
    extractFieldAfterLabel(flattenedText, [/Actividad economica principal/i, /46\.\s*Codigo/i])
  ]);
  const actividadPrincipalInfo = enrichEconomicActivity(actividadPrincipalCodigo);
  setField(result, fieldMetadata, "actividadEconomicaPrincipal", actividadPrincipalInfo.codigo || actividadPrincipalCodigo, {
    confianza: activityData.actividadEconomicaPrincipal ? "alta" : "baja"
  });
  setField(result, fieldMetadata, "actividadEconomicaPrincipalCodigo", actividadPrincipalInfo.codigo || actividadPrincipalCodigo, {
    confianza: actividadPrincipalInfo.codigo ? "alta" : "baja"
  });
  setField(result, fieldMetadata, "actividadEconomicaPrincipalNombre", actividadPrincipalInfo.nombre, {
    fuente: actividadPrincipalInfo.fuente || DERIVED_SOURCE,
    confianza: actividadPrincipalInfo.fuente === "catalogo_ciiu" ? "alta" : "media",
    requiereRevision: actividadPrincipalInfo.fuente !== "catalogo_ciiu"
  });
  setField(result, fieldMetadata, "actividadEconomicaPrincipalFuente", actividadPrincipalInfo.fuente, {
    fuente: DERIVED_SOURCE,
    confianza: actividadPrincipalInfo.fuente === "catalogo_ciiu" ? "alta" : "media",
    requiereRevision: false
  });
  setField(result, fieldMetadata, "fechaInicioActividadPrincipal", firstNonEmpty([
    activityData.fechaInicioActividadPrincipal,
    extractDateFromDigitSequence(extractFieldAfterLabel(flattenedText, [/47\.\s*Fecha inicio actividad/i]))
  ]), { confianza: activityData.fechaInicioActividadPrincipal ? "alta" : "baja", requiereRevision: false });
  setField(result, fieldMetadata, "actividadEconomicaSecundaria", activityData.actividadEconomicaSecundaria, {
    confianza: activityData.actividadEconomicaSecundaria ? "media" : "baja",
    requiereRevision: false
  });
  setField(result, fieldMetadata, "fechaInicioActividadSecundaria", activityData.fechaInicioActividadSecundaria, {
    confianza: activityData.fechaInicioActividadSecundaria ? "media" : "baja",
    requiereRevision: false
  });
  setField(result, fieldMetadata, "otrasActividades", activityData.otrasActividades, {
    confianza: activityData.otrasActividades ? "baja" : "baja",
    requiereRevision: false
  });
  setField(result, fieldMetadata, "numeroEstablecimientos", activityData.numeroEstablecimientos, {
    confianza: activityData.numeroEstablecimientos ? "media" : "baja",
    requiereRevision: false
  });

  const responsabilidadesTributarias = extractResponsibilities(flattenedText);
  result.responsabilidadesTributarias = responsabilidadesTributarias;
  fieldMetadata.responsabilidadesTributarias = annotateField(
    responsabilidadesTributarias,
    RUT_SOURCE,
    responsabilidadesTributarias.length ? "alta" : "baja",
    responsabilidadesTributarias.length === 0
  );

  const taxFlags = deriveTaxFlags(responsabilidadesTributarias);
  for (const [fieldName, value] of Object.entries(taxFlags)) {
    setField(result, fieldMetadata, fieldName, value, {
      fuente: DERIVED_SOURCE,
      confianza: value ? "alta" : "media",
      requiereRevision: false
    });
  }

  const regimenInfo = deriveRegimenTributario(responsabilidadesTributarias);
  setField(result, fieldMetadata, "regimenTributario", regimenInfo.regimenTributario, {
    fuente: DERIVED_SOURCE,
    confianza: regimenInfo.requiereRevisionRegimen ? "baja" : "alta",
    requiereRevision: regimenInfo.requiereRevisionRegimen
  });
  setField(result, fieldMetadata, "regimenTributarioFuente", regimenInfo.regimenTributarioFuente, {
    fuente: DERIVED_SOURCE,
    confianza: regimenInfo.regimenTributarioFuente ? "alta" : "baja",
    requiereRevision: regimenInfo.requiereRevisionRegimen
  });
  setField(result, fieldMetadata, "requiereRevisionRegimen", regimenInfo.requiereRevisionRegimen, {
    fuente: DERIVED_SOURCE,
    confianza: regimenInfo.requiereRevisionRegimen ? "media" : "alta",
    requiereRevision: false
  });

  const legalRepresentative = extractLegalRepresentative(flattenedText);
  result.representanteLegalPrincipal = legalRepresentative;
  fieldMetadata.representanteLegalPrincipal = annotateField(
    legalRepresentative,
    RUT_SOURCE,
    legalRepresentative.nombreCompleto ? "media" : "baja",
    !legalRepresentative.nombreCompleto
  );

  const generationDate = firstNonEmpty([
    (() => {
      const sourceLine = lines.find((line) => squashAccentless(line).includes("fecha generacion documento pdf"));
      return extractDateFromDigitSequence(sourceLine || "");
    })(),
    extractDateFromDigitSequence((flattenedText.match(/Fecha de generacion[:\s-]*([^\n]+)/i) || [])[1])
  ]);
  setField(result, fieldMetadata, "fechaGeneracionRut", generationDate, {
    confianza: generationDate ? "alta" : "baja",
    requiereRevision: false
  });

  setField(result, fieldMetadata, "paginasDetectadas", pagesDetected, {
    confianza: pagesDetected ? "alta" : "baja",
    requiereRevision: false
  });

  const preview = flattenedText.slice(0, 1400).trim();
  setField(result, fieldMetadata, "textoExtraidoPreview", preview, {
    confianza: preview ? "alta" : "baja",
    requiereRevision: false
  });

  return {
    datosExtraidos: result,
    metadataCampos: fieldMetadata
  };
}

function isUsefulExtractedText(text) {
  if (!text || text.length < 12) {
    return false;
  }

  const printableChars = text.match(/[A-Za-z0-9@#:/.,()\- \n]/g) || [];
  return printableChars.length / text.length >= 0.5;
}

export async function extractRutDataFromPdf(buffer) {
  let parser;

  try {
    parser = new PDFParse({ data: buffer });
    const parsed = await parser.getText();
    const normalizedText = normalizeRutText(parsed?.text || "");

    if (!isUsefulExtractedText(normalizedText)) {
      return {
        estadoExtraccion: EXTRACTION_STATUS.REQUIRES_REVIEW,
        textoExtraido: "",
        textoExtraidoPreview: "",
        mensajeExtraccion: NO_TEXT_MESSAGE,
        datosExtraidos: buildDefaultExtractionData(),
        datosExtraidosOriginales: buildDefaultExtractionData(),
        metadataExtraccion: {
          paginasDetectadas: Number(parsed?.total || 0),
          textoExtraidoPreview: "",
          confidence: {
            criticalScore: 0,
            supportingScore: 0,
            percentage: 0
          },
          fieldMetadata: {}
        }
      };
    }

    const extracted = extractGenericRutData(normalizedText, Number(parsed?.total || 0));
    const datosExtraidos = extracted.datosExtraidos;
    const confidence = calculateExtractionConfidence(datosExtraidos);
    const estadoExtraccion = inferExtractionStatus(datosExtraidos);

    return {
      estadoExtraccion,
      textoExtraido: normalizedText.slice(0, 8000),
      textoExtraidoPreview: datosExtraidos.textoExtraidoPreview,
      mensajeExtraccion:
        estadoExtraccion === EXTRACTION_STATUS.REQUIRES_REVIEW
          ? "Se extrajo informacion parcial del RUT. Completa y verifica los campos manualmente."
          : null,
      datosExtraidos,
      datosExtraidosOriginales: structuredClone(datosExtraidos),
      metadataExtraccion: {
        paginasDetectadas: Number(parsed?.total || 0),
        textoExtraidoPreview: datosExtraidos.textoExtraidoPreview,
        confidence,
        fieldMetadata: extracted.metadataCampos
      }
    };
  } catch (error) {
    return {
      estadoExtraccion: EXTRACTION_STATUS.ERROR,
      textoExtraido: "",
      textoExtraidoPreview: "",
      mensajeExtraccion: "No fue posible procesar el PDF o no contiene texto seleccionable. Revisa los datos manualmente.",
      datosExtraidos: buildDefaultExtractionData(),
      datosExtraidosOriginales: buildDefaultExtractionData(),
      metadataExtraccion: {
        paginasDetectadas: 0,
        textoExtraidoPreview: "",
        confidence: {
          criticalScore: 0,
          supportingScore: 0,
          percentage: 0
        },
        fieldMetadata: {}
      },
      errorDetalle: error instanceof Error ? error.message : "Error desconocido al leer el PDF."
    };
  } finally {
    await parser?.destroy?.();
  }
}
