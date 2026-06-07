import { describe, expect, it } from "vitest";

import {
  calculateExtraHoursPay,
  estimateMonthlyBasePay,
  estimateWeeklyBasePay,
} from "@/lib/employees/pay";
import { employeeInputSchema } from "@/lib/validators/employees";

describe("employee payroll model", () => {
  it("estimates monthly base pay from hourly rate and fixed weekly hours", () => {
    expect(estimateWeeklyBasePay("100.00", 40)).toBe("4000.00");
    expect(estimateMonthlyBasePay("100.00", 40)).toBe("17333.33");
  });

  it("calculates extra-hour scenarios from the extra-hour rate", () => {
    expect(calculateExtraHoursPay("150.00", 4)).toBe("600.00");
    expect(calculateExtraHoursPay("150.00", 8)).toBe("1200.00");
  });

  it("validates fixed and extra hourly rates", () => {
    expect(
      employeeInputSchema.parse({
        name: "Ana",
        hourlyRate: "120",
        extraHourRate: "180.5",
        fixedWeeklyHours: "36",
      })
    ).toEqual({
      name: "Ana",
      hourlyRate: "120.00",
      extraHourRate: "180.50",
      fixedWeeklyHours: 36,
    });

    expect(
      employeeInputSchema.safeParse({
        name: "Ana",
        hourlyRate: "0",
        extraHourRate: "180.5",
        fixedWeeklyHours: "36",
      }).success
    ).toBe(false);
  });
});
