import { afterEach, describe, expect, it, vi } from "vitest";
import { enterAdFreeRoute, SOCIAL_BAR_SCRIPT_ID } from "./social-bar";

function page({ injected, storageBlocked = false }: { injected: boolean; storageBlocked?: boolean }) {
  const assign = vi.fn();
  vi.stubGlobal("document", {
    getElementById: (id: string) => (injected && id === SOCIAL_BAR_SCRIPT_ID ? {} : null),
  });
  vi.stubGlobal("window", {
    location: { assign },
    localStorage: {
      setItem: () => {
        if (storageBlocked) throw new Error("SecurityError");
      },
      removeItem: () => undefined,
    },
  });
  return { assign, router: { push: vi.fn() } };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("entering /play", () => {
  it("uses the client router when the social bar was never loaded", () => {
    const { assign, router } = page({ injected: false });
    enterAdFreeRoute(router, "/play");
    expect(router.push).toHaveBeenCalledWith("/play");
    expect(assign).not.toHaveBeenCalled();
  });

  it("does a full page load once the social bar is on the page, which leaves it behind", () => {
    const { assign, router } = page({ injected: true });
    enterAdFreeRoute(router, "/play");
    expect(assign).toHaveBeenCalledWith("/play");
    expect(router.push).not.toHaveBeenCalled();
  });

  it("keeps the client router when storage is blocked, so the in-memory game isn't lost", () => {
    const { assign, router } = page({ injected: true, storageBlocked: true });
    enterAdFreeRoute(router, "/play");
    expect(router.push).toHaveBeenCalledWith("/play");
    expect(assign).not.toHaveBeenCalled();
  });
});
