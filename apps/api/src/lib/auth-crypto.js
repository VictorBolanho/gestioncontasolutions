import crypto from "node:crypto";

const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_MAXMEM = 256 * 1024 * 1024;
const SCRYPT_LIMITS = Object.freeze({
  maxN: 131072,
  maxR: 8,
  maxP: 2,
  maxKeyLength: SCRYPT_KEY_LENGTH,
  maxSaltBytes: 32
});
const SCRYPT_POLICIES = Object.freeze({
  v1: Object.freeze({ N: 16384, r: 8, p: 1, keyLength: SCRYPT_KEY_LENGTH }),
  v2: Object.freeze({ N: 131072, r: 8, p: 1, keyLength: SCRYPT_KEY_LENGTH })
});
const CURRENT_SCRYPT_VERSION = "v2";

function constantTimeEqualBuffers(left, right) {
  const leftBuffer = Buffer.isBuffer(left) ? left : Buffer.from(left);
  const rightBuffer = Buffer.isBuffer(right) ? right : Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function constantTimeEqualHex(left, right) {
  const normalizedLeft = String(left || "").trim().toLowerCase();
  const normalizedRight = String(right || "").trim().toLowerCase();
  if (
    normalizedLeft.length % 2 !== 0 ||
    normalizedRight.length % 2 !== 0 ||
    !/^[a-f0-9]+$/.test(normalizedLeft) ||
    !/^[a-f0-9]+$/.test(normalizedRight)
  ) {
    return false;
  }
  return constantTimeEqualBuffers(Buffer.from(normalizedLeft, "hex"), Buffer.from(normalizedRight, "hex"));
}

function deriveScrypt(password, salt, policy) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(
      String(password ?? ""),
      salt,
      policy.keyLength,
      { N: policy.N, r: policy.r, p: policy.p, maxmem: SCRYPT_MAXMEM },
      (error, derivedKey) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(derivedKey);
      }
    );
  });
}

export async function createPasswordCredential(password, { salt, version = CURRENT_SCRYPT_VERSION } = {}) {
  const policy = SCRYPT_POLICIES[version];
  if (!policy) {
    throw new Error("Version scrypt no soportada para crear credenciales.");
  }
  const passwordSalt = String(salt || crypto.randomBytes(16).toString("hex"));
  if (!/^[a-f0-9]{32}$/i.test(passwordSalt)) {
    throw new Error("Salt scrypt no valido.");
  }
  const derivedKey = await deriveScrypt(password, passwordSalt, policy);
  return {
    passwordSalt,
    passwordHash: [
      "scrypt",
      version,
      policy.N,
      policy.r,
      policy.p,
      policy.keyLength,
      passwordSalt.toLowerCase(),
      derivedKey.toString("hex")
    ].join("$")
  };
}

function parseScryptHash(encodedHash) {
  const match = /^scrypt\$(v[0-9]+)\$([0-9]+)\$([0-9]+)\$([0-9]+)\$([0-9]+)\$([a-f0-9]+)\$([a-f0-9]+)$/i.exec(
    String(encodedHash || "")
  );
  if (!match) {
    return null;
  }

  const [, version, nRaw, rRaw, pRaw, keyLengthRaw, salt, expectedHex] = match;
  const values = [nRaw, rRaw, pRaw, keyLengthRaw];
  if (values.some((value) => !/^(0|[1-9][0-9]*)$/.test(value))) {
    return null;
  }

  const parsed = {
    version,
    N: Number(nRaw),
    r: Number(rRaw),
    p: Number(pRaw),
    keyLength: Number(keyLengthRaw),
    salt: salt.toLowerCase(),
    expectedHex: expectedHex.toLowerCase()
  };
  const policy = SCRYPT_POLICIES[parsed.version];
  if (
    !policy ||
    !Number.isSafeInteger(parsed.N) ||
    !Number.isSafeInteger(parsed.r) ||
    !Number.isSafeInteger(parsed.p) ||
    !Number.isSafeInteger(parsed.keyLength) ||
    parsed.N <= 1 ||
    (parsed.N & (parsed.N - 1)) !== 0 ||
    parsed.N > SCRYPT_LIMITS.maxN ||
    parsed.r <= 0 ||
    parsed.r > SCRYPT_LIMITS.maxR ||
    parsed.p <= 0 ||
    parsed.p > SCRYPT_LIMITS.maxP ||
    parsed.keyLength <= 0 ||
    parsed.keyLength > SCRYPT_LIMITS.maxKeyLength ||
    parsed.salt.length !== 32 ||
    parsed.salt.length / 2 > SCRYPT_LIMITS.maxSaltBytes ||
    parsed.expectedHex.length !== parsed.keyLength * 2 ||
    parsed.N !== policy.N ||
    parsed.r !== policy.r ||
    parsed.p !== policy.p ||
    parsed.keyLength !== policy.keyLength
  ) {
    return null;
  }
  return { ...parsed, policy };
}

async function verifyScryptPassword(password, encodedHash) {
  const parsed = parseScryptHash(encodedHash);
  if (!parsed) {
    return { valid: false, version: "" };
  }
  const derivedKey = await deriveScrypt(password, parsed.salt, parsed.policy);
  return {
    valid: constantTimeEqualBuffers(derivedKey, Buffer.from(parsed.expectedHex, "hex")),
    version: parsed.version
  };
}

function verifyLegacySha256Password(password, passwordSalt, passwordHash) {
  if (!passwordSalt || !/^[a-f0-9]{64}$/i.test(String(passwordHash || ""))) {
    return false;
  }
  const candidate = crypto.createHash("sha256").update(`${passwordSalt}:${String(password ?? "")}`).digest("hex");
  return constantTimeEqualHex(candidate, passwordHash);
}

export async function verifyPasswordCredential(password, credential = {}) {
  const passwordHash = String(credential.passwordHash || "");
  if (passwordHash.startsWith("scrypt$")) {
    const result = await verifyScryptPassword(password, passwordHash);
    return {
      valid: result.valid,
      needsUpgrade: result.valid && result.version !== CURRENT_SCRYPT_VERSION
    };
  }
  const valid = verifyLegacySha256Password(password, credential.passwordSalt, passwordHash);
  return { valid, needsUpgrade: valid };
}

export function hashSessionToken(token) {
  return crypto.createHash("sha256").update(String(token || "")).digest("hex");
}

export function formatSessionTokenHash(token) {
  return `sha256$${hashSessionToken(token)}`;
}

export function sessionTokenHashMatches(token, storedHash) {
  const normalized = String(storedHash || "").trim().toLowerCase();
  const digest = normalized.startsWith("sha256$") ? normalized.slice(7) : normalized;
  return constantTimeEqualHex(hashSessionToken(token), digest);
}

export const passwordHashPolicy = Object.freeze({
  algorithm: "scrypt",
  version: CURRENT_SCRYPT_VERSION,
  maxmem: SCRYPT_MAXMEM,
  ...SCRYPT_POLICIES[CURRENT_SCRYPT_VERSION]
});

export const passwordHashLimits = SCRYPT_LIMITS;
