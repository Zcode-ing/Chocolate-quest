import { createHash, timingSafeEqual } from "node:crypto";
import { Router, type IRouter } from "express";
import {
  VerifyDeveloperAccessBody,
  VerifyDeveloperAccessResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const failedAttempts = new Map<string, { count: number; resetAt: number }>();
const ATTEMPT_WINDOW_MS = 5 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000;

function digest(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

router.post("/developer/verify", (req, res): void => {
  const parsed = VerifyDeveloperAccessBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid developer access request." });
    return;
  }

  const expectedCode = process.env.CHOCOLATE_QUEST_DEV_ACCESS_CODE;
  if (!expectedCode) {
    req.log.error("Developer access attempted before its secret was configured.");
    res.status(503).json({ error: "Developer access is not configured." });
    return;
  }

  const address = req.ip || "unknown";
  const now = Date.now();
  const prior = failedAttempts.get(address);
  if (prior && prior.resetAt > now && prior.count >= MAX_FAILED_ATTEMPTS) {
    res.status(429).json({ error: "Too many attempts. Try again in a few minutes." });
    return;
  }

  if (prior && prior.resetAt <= now) failedAttempts.delete(address);
  const submittedDigest = digest(parsed.data.accessCode);
  const expectedDigest = digest(expectedCode);
  const verified = timingSafeEqual(submittedDigest, expectedDigest);

  if (verified) {
    failedAttempts.delete(address);
    res.json(VerifyDeveloperAccessResponse.parse({ verified: true }));
    return;
  }

  const current = failedAttempts.get(address);
  const next = current && current.resetAt > now
    ? { count: current.count + 1, resetAt: current.resetAt }
    : { count: 1, resetAt: now + ATTEMPT_WINDOW_MS };
  if (next.count >= MAX_FAILED_ATTEMPTS) {
    next.resetAt = now + LOCKOUT_MS;
  }
  failedAttempts.set(address, next);
  res.json(VerifyDeveloperAccessResponse.parse({ verified: false }));
});

export default router;