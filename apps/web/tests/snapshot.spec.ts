import { test, expect } from "@playwright/test";
import { routes } from "./snapshot.routes";

const snapshotNameFor = (route: string) => route.replace(/\W+/g, "_") + ".txt";
const attachmentNameFor = (route: string) => route.replace(/\W+/g, "_") + ".png";

for (const path of routes) {
  test(`snapshot ${path}`, async ({ page }, testInfo) => {
    await page.goto(path, { waitUntil: "networkidle" });
    const screenshot = await page.screenshot({ fullPage: true });
    await testInfo.attach(attachmentNameFor(path), {
      body: screenshot,
      contentType: "image/png"
    });
    await expect(screenshot.toString("base64")).toMatchSnapshot(
      snapshotNameFor(path)
    );
  });
}
