const sanitizeObject = (value, transformString) => {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      value[index] = sanitizeObject(item, transformString);
    });
    return value;
  }

  if (typeof value === "string") {
    return transformString ? transformString(value) : value;
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  Object.keys(value).forEach((key) => {
    const sanitizedKey = key.replace(/^\$+/g, "").replace(/\./g, "_");
    const sanitizedValue = sanitizeObject(value[key], transformString);

    if (sanitizedKey !== key) {
      delete value[key];
      value[sanitizedKey] = sanitizedValue;
    } else {
      value[key] = sanitizedValue;
    }
  });

  return value;
};

const sanitizeMongo = (req, res, next) => {
  if (req.body) {
    sanitizeObject(req.body);
  }

  if (req.params) {
    sanitizeObject(req.params);
  }

  if (req.query) {
    sanitizeObject(req.query);
  }

  next();
};

const escapeDangerousCharacters = (value) =>
  value
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");

const sanitizeXss = (req, res, next) => {
  if (req.body) {
    sanitizeObject(req.body, escapeDangerousCharacters);
  }

  if (req.params) {
    sanitizeObject(req.params, escapeDangerousCharacters);
  }

  if (req.query) {
    sanitizeObject(req.query, escapeDangerousCharacters);
  }

  next();
};

module.exports = {
  sanitizeMongo,
  sanitizeXss
};
