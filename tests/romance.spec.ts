import { test, expect, type Page } from "@playwright/test";

async function unlock(page: Page) {
  await page.getByRole("button", { name: "轻触解锁", exact: true }).click();
  await expect(page.locator(".interactive-home")).toHaveCSS("opacity", "1");
}
async function chat(page: Page) {
  await page.getByRole("button", { name: "打开信息", exact: true }).click();
  await page.locator(".catalog-chat").filter({ hasText: "周予安 ♡" }).click();
  await expect(
    page.getByRole("textbox", { name: "给男友发消息" }),
  ).toBeVisible();
}

test("own phone, real text entry, boyfriend response and reload persistence", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page).toHaveTitle("和你，日常 · 捡手机");
  await unlock(page);
  await page.screenshot({ path: "outputs/romance-home.png" });
  await chat(page);
  await page.getByRole("textbox", { name: "给男友发消息" }).fill("今天有点累");
  await page.getByRole("button", { name: "发送消息", exact: true }).click();
  await expect(page.locator(".catalog-message.outgoing").last()).toContainText(
    "今天有点累",
  );
  await expect(page.locator(".catalog-message").last()).toContainText(
    "辛苦了，知夏",
  );
  await expect(page.getByRole("textbox", { name: "给男友发消息" })).toBeEmpty();
  await page.screenshot({ path: "outputs/romance-chat.png" });
  // Give the existing asynchronous IndexedDB save a visible round trip before reloading.
  await page.getByRole("button", { name: "返回桌面", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "打开信息", exact: true }),
  ).toBeVisible();
  await page.reload();
  await unlock(page);
  await chat(page);
  await expect(page.locator(".catalog-message").last()).toContainText(
    "辛苦了，知夏",
  );
  await page.getByRole("button", { name: /忙完了吗，知夏/ }).click();
  await page
    .getByRole("button", { name: "和你一起做晚饭", exact: true })
    .click();
  await expect(page.locator(".catalog-message").last()).toContainText(
    "今天的大厨",
  );
  expect(errors).toEqual([]);
});

for (const route of [
  { name: "和你一起做晚饭", reply: "今天的大厨", ending: "厨房里的小幸福" },
  { name: "想去书店约会", reply: "你挑书", ending: "书页之间的心动" },
  { name: "今晚陪我视频吧", reply: "偶尔抬头", ending: "隔着屏幕的晚安" },
])
  test(`date route: ${route.name}`, async ({ page }) => {
    await page.goto("/");
    await unlock(page);
    await chat(page);
    await page.getByRole("button", { name: /忙完了吗，知夏/ }).click();
    await page.getByRole("button", { name: route.name, exact: true }).click();
    await page.getByRole("button", { name: new RegExp(route.reply) }).click();
    await page
      .getByRole("button", { name: "今天有点累，想被抱抱", exact: true })
      .click();
    await page
      .getByRole("button", { name: /那今天先不用当很厉害的大人/ })
      .click();
    await page.getByRole("button", { name: /今晚就按你舒服的方式来/ }).click();
    await page
      .getByRole("button", { name: "好，今晚的时间留给我们", exact: true })
      .click();
    await expect(page.locator(".catalog-message").last()).toContainText(
      route.ending === "厨房里的小幸福"
        ? "番茄炒蛋"
        : route.ending === "书页之间的心动"
          ? "书签"
          : "普通晚上",
    );
    await page.locator(".catalog-message").last().getByRole("button").click();
    await page.getByRole("button", { name: "返回桌面", exact: true }).click();
    await page.getByRole("button", { name: "打开备忘录", exact: true }).click();
    await page
      .locator(".notes-list button")
      .filter({ hasText: `收藏今天 · ${route.ending}` })
      .click();
    await page.getByRole("button", { name: "收藏这一天", exact: true }).click();
    await expect(page.locator(".story-overlay.ending")).toContainText(
      route.ending,
    );
  });

test("mobile phone fits and the original full app preview remains available", async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await unlock(page);
  const rect = await page.locator(".phone-shell").boundingBox();
  expect(rect!.width).toBeLessThanOrEqual(390);
  expect(rect!.height).toBeLessThanOrEqual(844);
  await chat(page);
  await expect(
    page.getByRole("textbox", { name: "给男友发消息" }),
  ).toBeVisible();
  await page.screenshot({ path: "outputs/romance-mobile.png" });
  const preview = await (await request.get("/test-work.json")).json();
  expect(
    preview.apps.filter((app: { installed: boolean }) => app.installed),
  ).toHaveLength(49);
  await page.goto("/?preview=test");
  await unlock(page);
  await expect(
    page.getByRole("button", { name: "打开微信", exact: true }),
  ).toBeVisible();
});
