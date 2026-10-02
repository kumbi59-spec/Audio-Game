import AxeBuilder from "@axe-core/playwright";
import { expect, test as base, type Page } from "@playwright/test";

/**
 * Every test runs against our own origin only: analytics, ad and font
 * requests are aborted so results don't depend on third parties. Browser
 * speech is stubbed to finish instantly — headless Chromium has no voices,
 * and a narration that never ends would leave the game "generating".
 */
export const test = base.extend({
  page: async ({ page, baseURL }, use) => {
    const origin = new URL(baseURL!).origin;
    await page.route("**/*", (route) =>
      route.request().url().startsWith(origin) ? route.continue() : route.abort(),
    );
    await page.addInitScript(() => {
      const synth = window.speechSynthesis;
      if (!synth) return;
      synth.speak = (u: SpeechSynthesisUtterance) => {
        setTimeout(() => u.onend?.(new Event("end") as SpeechSynthesisEvent), 0);
      };
      synth.cancel = () => undefined;
    });
    await use(page);
  },
});

export { expect };

/** Fails on serious or critical WCAG 2.1 A/AA violations. */
export async function expectNoSeriousA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(
    serious.map((v) => ({ id: v.id, help: v.help, targets: v.nodes.map((n) => n.target.join(" ")) })),
  ).toEqual([]);
}
