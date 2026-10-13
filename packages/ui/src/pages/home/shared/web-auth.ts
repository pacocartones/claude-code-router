// The web management page reaches the CCR service through /api/ccr/rpc with a
// token. A request without a valid token is answered with 401; that is a
// different condition from "not configured yet" and must not open onboarding.
export const webAuthRequiredErrorCode = "CCR_WEB_AUTH_REQUIRED";

export function webAuthRequiredError(message: string): Error {
  return Object.assign(new Error(message), { code: webAuthRequiredErrorCode });
}

export function isWebAuthRequiredError(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: unknown }).code === webAuthRequiredErrorCode;
}
