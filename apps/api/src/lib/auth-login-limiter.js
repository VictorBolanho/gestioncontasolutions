const CONFIG_LIMITS = Object.freeze({
  maxFailures: 1000,
  maxWindowMs: 24 * 60 * 60 * 1000,
  maxLockMs: 24 * 60 * 60 * 1000,
  maxEntries: 10000
});

function boundedInteger(value, fallback, maximum, minimum = 1) {
  const raw = String(value ?? "");
  if (!/^(0|[1-9][0-9]*)$/.test(raw)) {
    return fallback;
  }
  const parsed = Number(raw);
  return Number.isSafeInteger(parsed) && parsed >= minimum && parsed <= maximum ? parsed : fallback;
}

function buildConfig(env, prefix, defaults) {
  return {
    maxFailures: boundedInteger(env[`${prefix}_MAX_FAILURES`], defaults.maxFailures, CONFIG_LIMITS.maxFailures),
    windowMs: boundedInteger(env[`${prefix}_FAILURE_WINDOW_MS`], defaults.windowMs, CONFIG_LIMITS.maxWindowMs),
    baseLockMs: boundedInteger(env[`${prefix}_LOCK_BASE_MS`], defaults.baseLockMs, CONFIG_LIMITS.maxLockMs),
    maxLockMs: boundedInteger(env[`${prefix}_LOCK_MAX_MS`], defaults.maxLockMs, CONFIG_LIMITS.maxLockMs),
    maxEntries: boundedInteger(env[`${prefix}_MAX_TRACKED_KEYS`], defaults.maxEntries, CONFIG_LIMITS.maxEntries)
  };
}

export function getLoginLimitConfigs(env = process.env) {
  return {
    email: buildConfig(env, "AUTH_LOGIN", {
      maxFailures: 5,
      windowMs: 15 * 60 * 1000,
      baseLockMs: 30 * 1000,
      maxLockMs: 15 * 60 * 1000,
      maxEntries: 5000
    }),
    remote: buildConfig(env, "AUTH_LOGIN_REMOTE", {
      maxFailures: 20,
      windowMs: 15 * 60 * 1000,
      baseLockMs: 60 * 1000,
      maxLockMs: 15 * 60 * 1000,
      maxEntries: 2000
    }),
    global: buildConfig(env, "AUTH_LOGIN_GLOBAL", {
      maxFailures: 100,
      windowMs: 5 * 60 * 1000,
      baseLockMs: 30 * 1000,
      maxLockMs: 5 * 60 * 1000,
      maxEntries: 1
    })
  };
}

export class ProgressiveLoginLimiter {
  constructor(config) {
    this.config = config;
    this.entries = new Map();
  }

  get size() {
    return this.entries.size;
  }

  check(key, now = Date.now()) {
    const entry = this.entries.get(key);
    if (!entry) {
      return { allowed: true, retryAfterMs: 0 };
    }
    if (entry.blockedUntil > now) {
      return { allowed: false, retryAfterMs: entry.blockedUntil - now };
    }
    if (now - entry.windowStartedAt >= this.config.windowMs) {
      this.entries.delete(key);
    }
    return { allowed: true, retryAfterMs: 0 };
  }

  recordFailure(key, now = Date.now()) {
    const previous = this.entries.get(key);
    const expiredWindow = !previous || now - previous.windowStartedAt >= this.config.windowMs;
    const entry = expiredWindow
      ? { failures: 0, windowStartedAt: now, blockedUntil: 0 }
      : { ...previous };

    entry.failures += 1;
    if (entry.failures >= this.config.maxFailures) {
      const lockLevel = Math.min(entry.failures - this.config.maxFailures, 30);
      const lockMs = Math.min(this.config.baseLockMs * 2 ** lockLevel, this.config.maxLockMs);
      entry.blockedUntil = now + lockMs;
    }

    if (!previous) {
      while (this.entries.size >= this.config.maxEntries) {
        this.entries.delete(this.entries.keys().next().value);
      }
    } else {
      this.entries.delete(key);
    }
    this.entries.set(key, entry);
    return { failures: entry.failures, blockedUntil: entry.blockedUntil };
  }

  reset(key) {
    this.entries.delete(key);
  }
}

export function createLoginLimiters(env = process.env) {
  const configs = getLoginLimitConfigs(env);
  return {
    email: new ProgressiveLoginLimiter(configs.email),
    remote: new ProgressiveLoginLimiter(configs.remote),
    global: new ProgressiveLoginLimiter(configs.global)
  };
}

export const loginLimitConfigLimits = CONFIG_LIMITS;
