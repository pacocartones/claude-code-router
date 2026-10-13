import assert from "node:assert/strict";
import test from "node:test";
import { isWebAuthRequiredError } from "@ccr/ui/pages/home/shared/web-auth.ts";

type FakeWindow = {
  ccr?: Record<string, (...args: unknown[]) => Promise<unknown>>;
  history: { replaceState: () => void; state: null };
  location: { href: string };
  sessionStorage: { getItem: () => null; setItem: () => void };
};

const fakeWindow: FakeWindow = {
  history: { replaceState: () => undefined, state: null },
  location: { href: "http://127.0.0.1:3458/" },
  sessionStorage: { getItem: () => null, setItem: () => undefined }
};

async function loadBridgeWithStatus(status: number, body: unknown): Promise<NonNullable<FakeWindow["ccr"]>> {
  Object.assign(globalThis, {
    fetch: async () => new Response(JSON.stringify(body), { headers: { "content-type": "application/json" }, status }),
    window: fakeWindow
  });
  await import("@ccr/ui/web-client-bridge.ts");
  assert.ok(fakeWindow.ccr, "the web bridge installs window.ccr");
  return fakeWindow.ccr;
}

test("a 401 from the management RPC is reported as a missing web token, not as an ordinary failure", async () => {
  const ccr = await loadBridgeWithStatus(401, {
    error: { message: "CCR web authentication token is missing or invalid." },
    ok: false
  });
  const error = await ccr.getOnboardingFinished().then(() => undefined, (reason: unknown) => reason);
  assert.ok(error instanceof Error);
  assert.equal(error.message, "CCR web authentication token is missing or invalid.");
  assert.equal(isWebAuthRequiredError(error), true);
});

test("other RPC failures are not mistaken for a missing web token", async () => {
  const ccr = await loadBridgeWithStatus(500, { error: { message: "boom" }, ok: false });
  const error = await ccr.getOnboardingFinished().then(() => undefined, (reason: unknown) => reason);
  assert.ok(error instanceof Error);
  assert.equal(isWebAuthRequiredError(error), false);
  assert.equal(isWebAuthRequiredError(new Error("CCR web authentication token is missing or invalid.")), false);
  assert.equal(isWebAuthRequiredError(undefined), false);
});
