import React from "react";
import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { EvidenceScreenProvider, useEvidenceScreen, useEvidenceScreenCtx } from "../EvidenceContext";

const mockPathname = usePathname as jest.Mock;

function Display() {
  const { currentScreenId, currentScreenName } = useEvidenceScreenCtx();
  return <><span data-testid="id">{currentScreenId}</span><span data-testid="name">{currentScreenName}</span></>;
}

function Override({ id, name }: { id: string; name: string }) {
  useEvidenceScreen(id, name);
  return null;
}

function setup(pathname: string, children?: React.ReactNode) {
  mockPathname.mockReturnValue(pathname);
  return render(<EvidenceScreenProvider>{children}<Display /></EvidenceScreenProvider>);
}

test("루트 경로는 'Main'으로 파생된다", () => {
  setup("/");
  expect(screen.getByTestId("id").textContent).toBe("Main");
});

test("중첩 경로는 PascalCase로 연결된다", () => {
  setup("/admin/user/detail");
  expect(screen.getByTestId("id").textContent).toBe("AdminUserDetail");
});

test("useEvidenceScreen 마운트 시 screenId·screenName이 override된다", () => {
  setup("/", <Override id="POPUP" name="팝업" />);
  expect(screen.getByTestId("id").textContent).toBe("POPUP");
  expect(screen.getByTestId("name").textContent).toBe("팝업");
});
