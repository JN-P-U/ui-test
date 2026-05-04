import { test, expect, Page } from "@playwright/test";

async function openModal(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: /테스트결과 추가/ }).click();
  await expect(page.getByText("테스트 증빙 생성")).toBeVisible();
}

test.describe("기본 플로우", () => {
  test("플로팅 버튼이 보이고 클릭 시 모달이 열리며 캡처 1건이 추가된다", async ({ page }) => {
    await openModal(page);
    await expect(page.getByText(/1건/)).toBeVisible();
    await expect(page.locator("img[alt='케이스 1 캡처']")).toBeVisible();
  });

  test("서비스코드 미입력 시 경고가 표시된다", async ({ page }) => {
    await openModal(page);
    await page.getByRole("button", { name: "엑셀 다운로드" }).click();
    await expect(page.getByText("서비스코드를 입력해주세요.")).toBeVisible();
  });

  test("서비스코드 입력 시 파일명 미리보기가 업데이트된다", async ({ page }) => {
    await openModal(page);
    await page.getByPlaceholder("예) CHC").fill("XYZ");
    await expect(page.getByText(/MAL_XYZ_AC02/)).toBeVisible();
  });

  test("닫기 후 플로팅 버튼이 다시 표시된다", async ({ page }) => {
    await openModal(page);
    await page.getByRole("button", { name: "✕" }).first().click();
    await expect(page.getByRole("button", { name: /테스트결과 추가|케이스 추가/ })).toBeVisible();
  });
});

test.describe("케이스 관리 및 다운로드", () => {
  test("케이스 삭제 후 0건이 된다", async ({ page }) => {
    await openModal(page);
    await page.getByTitle("케이스 삭제").click();
    await expect(page.getByText("캡처된 케이스가 없습니다")).toBeVisible();
  });

  test("서비스코드 입력 후 다운로드 시 xlsx 파일이 저장된다", async ({ page }) => {
    await openModal(page);
    await page.getByPlaceholder("예) CHC").fill("CHC");
    const download = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "엑셀 다운로드" }).click(),
    ]).then(([d]) => d);
    expect(download.suggestedFilename()).toMatch(/MAL_CHC_AC02.*V1\.0\.xlsx/);
  });
});
