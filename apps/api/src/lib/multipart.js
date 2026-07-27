import { HttpRequestError } from "./http.js";

function parseHeaders(rawHeaders) {
  return rawHeaders.split("\r\n").reduce((acc, line) => {
    const index = line.indexOf(":");
    if (index === -1) {
      return acc;
    }

    const name = line.slice(0, index).trim().toLowerCase();
    const value = line.slice(index + 1).trim();
    acc[name] = value;
    return acc;
  }, {});
}

function parseDisposition(value = "") {
  return value.split(";").reduce((acc, item) => {
    const [rawKey, rawValue] = item.split("=");
    const key = rawKey.trim();

    if (!rawValue) {
      acc.type = key;
      return acc;
    }

    acc[key] = rawValue.trim().replace(/^"|"$/g, "");
    return acc;
  }, {});
}

export function parseMultipartFormData(buffer, contentType) {
  const boundaryMatch = contentType.match(/boundary=(.+)$/i);
  if (!boundaryMatch) {
    throw new HttpRequestError("No se encontro boundary en multipart/form-data.", 400);
  }

  const boundary = `--${boundaryMatch[1]}`;
  const raw = buffer.toString("latin1");
  const segments = raw.split(boundary).slice(1, -1);

  return segments
    .map((segment) => segment.replace(/^\r\n/, "").replace(/\r\n$/, ""))
    .filter(Boolean)
    .map((segment) => {
      const [rawHeaders, rawBody = ""] = segment.split("\r\n\r\n");
      const headers = parseHeaders(rawHeaders);
      const disposition = parseDisposition(headers["content-disposition"]);
      const bodyBinary = rawBody.replace(/\r\n$/, "");
      const body = Buffer.from(bodyBinary, "latin1");

      return {
        headers,
        name: disposition.name,
        filename: disposition.filename,
        contentType: headers["content-type"] || "text/plain",
        body
      };
    });
}
