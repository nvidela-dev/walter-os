import Decimal from "decimal.js";

import { toDecimalString } from "@/lib/money";

const WEEKS_PER_MONTH = new Decimal(52).div(12);

export function estimateWeeklyBasePay(hourlyRate: string, fixedWeeklyHours: number): string {
  return toDecimalString(new Decimal(hourlyRate).mul(fixedWeeklyHours), 2);
}

export function estimateMonthlyBasePay(hourlyRate: string, fixedWeeklyHours: number): string {
  return toDecimalString(new Decimal(hourlyRate).mul(fixedWeeklyHours).mul(WEEKS_PER_MONTH), 2);
}

export function calculateExtraHoursPay(extraHourRate: string, hours: number): string {
  return toDecimalString(new Decimal(extraHourRate).mul(hours), 2);
}
