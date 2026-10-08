import { describe, expect, test } from "bun:test";
import { MONTHLY_PLANS, verifiedPaidCycle } from "./billing-cycle";
import { hasBillingAccess } from "./subscription-access";

const payment = { id: "pay_test", status: "captured", amount: 59900, currency: "INR", created_at: Date.parse("2026-01-31T12:00:00Z") / 1000 };

describe("Paid monthly memberships", () => {
  test("prices match the requested monthly tiers", () => {
    expect(Object.values(MONTHLY_PLANS).map(plan => plan.price)).toEqual([199, 399, 599]);
  });
  test("captured payment grants a calendar month including month-end", () => {
    expect(verifiedPaidCycle({}, payment, 59900).expiresAt).toBe("2026-02-28T12:00:00.000Z");
  });
  test("authorization, wrong price, and wrong currency cannot activate access", () => {
    for (const changed of [{ status: "authorized" }, { amount: 500 }, { currency: "USD" }]) {
      expect(() => verifiedPaidCycle({}, { ...payment, ...changed }, 59900)).toThrow();
    }
  });
  test("old checkout callbacks cannot renew another month", () => {
    expect(() => verifiedPaidCycle({ current_start: payment.created_at + 31 * 86400 }, payment, 59900)).toThrow();
  });
  test("access is bounded and matches each tier", () => {
    const now = new Date("2026-02-01T00:00:00Z");
    const cycle = { status: "active" as const, current_period_expires_at: "2026-02-28T12:00:00Z" };
    expect(hasBillingAccess({ ...cycle, plan: "silver" }, "diet", now)).toBe(true);
    expect(hasBillingAccess({ ...cycle, plan: "silver" }, "workout", now)).toBe(false);
    expect(hasBillingAccess({ ...cycle, plan: "gold" }, "workout", now)).toBe(true);
    expect(hasBillingAccess({ ...cycle, plan: "gold" }, "scanner", now)).toBe(false);
    expect(hasBillingAccess({ ...cycle, plan: "platinum" }, "ai_chat", now)).toBe(true);
    expect(hasBillingAccess({ ...cycle, plan: "platinum", status: "pending" }, "diet", now)).toBe(false);
    expect(hasBillingAccess({ status: "active", plan: "platinum" }, "diet", now)).toBe(false);
    expect(hasBillingAccess({ ...cycle, plan: "platinum" }, "diet", new Date("2026-03-01"))).toBe(false);
    expect(hasBillingAccess({ ...cycle, plan: "platinum", status: "cancelled" }, "diet", now)).toBe(true);
  });
});