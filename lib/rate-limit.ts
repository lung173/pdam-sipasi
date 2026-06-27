export interface RateLimitInfo {
  count: number;
  lastReset: number;
}

const rateLimits = new Map<string, RateLimitInfo>();

export function checkRateLimit(ip: string, limit: number, windowMs: number): { success: boolean; limit: number; remaining: number } {
  const now = Date.now();
  let info = rateLimits.get(ip);

  if (!info) {
    info = { count: 0, lastReset: now };
    rateLimits.set(ip, info);
  }

  // Reset if window has passed
  if (now - info.lastReset > windowMs) {
    info.count = 0;
    info.lastReset = now;
  }

  info.count += 1;
  const remaining = Math.max(0, limit - info.count);

  return {
    success: info.count <= limit,
    limit,
    remaining,
  };
}
