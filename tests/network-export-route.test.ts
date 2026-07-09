// Phase B / B3 — the L1 export route ENFORCES "Level 1 only" and auth, server-side. Session +
// network reads are mocked so we exercise the route's authorization/refusal logic deterministically.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const h = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  getL1Export: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ getCurrentUser: h.getCurrentUser }));
vi.mock("@/lib/affiliate/network", () => ({
  getL1Export: h.getL1Export,
  l1ToCsv: (rows: unknown[]) =>
    `Name,Mobile,Joined (IST),Packages\n#rows=${rows.length}`,
}));

import { GET } from "@/app/dashboard/earn/network/export/route";

const req = (q: string) =>
  new NextRequest(`http://localhost/dashboard/earn/network/export${q}`);

beforeEach(() => {
  vi.clearAllMocks();
  h.getCurrentUser.mockResolvedValue({
    id: `u-${Math.random()}`,
    referralCode: "GSX",
  });
  h.getL1Export.mockResolvedValue([
    { name: "Asha", mobile: "+9199", joinedAt: new Date(), packages: [] },
  ]);
});

describe("network export route (B3)", () => {
  it("refuses Level 2 export server-side (403), never reading data", async () => {
    const res = await GET(req("?level=2"));
    expect(res.status).toBe(403);
    expect(h.getL1Export).not.toHaveBeenCalled();
  });

  it("refuses Level 3 export server-side (403)", async () => {
    const res = await GET(req("?level=3"));
    expect(res.status).toBe(403);
  });

  it("unauthenticated → 401, no data read", async () => {
    h.getCurrentUser.mockResolvedValue(null);
    const res = await GET(req("?level=1"));
    expect(res.status).toBe(401);
    expect(h.getL1Export).not.toHaveBeenCalled();
  });

  it("Level 1 (default) → 200 CSV attachment for the signed-in user", async () => {
    const res = await GET(req("?level=1"));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/csv");
    expect(res.headers.get("content-disposition")).toContain(
      "my-network-level-1.csv",
    );
    expect(h.getL1Export).toHaveBeenCalledTimes(1);
  });
});
