"use client";

import { useRouter } from "next/navigation";
import { type ReactElement, useMemo, useState } from "react";

import { FormMessage } from "@/components/form-feedback";
import { useActionForm } from "@/components/hooks/use-action-form";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { t } from "@/i18n";
import { createEmployee, updateEmployee } from "@/lib/actions/employees";
import {
  calculateExtraHoursPay,
  estimateMonthlyBasePay,
  estimateWeeklyBasePay,
} from "@/lib/employees/pay";
import { getFormString } from "@/lib/form";
import type { EmployeeView } from "@/lib/types/employees";

function calculateEstimate(calculate: () => string): string | null {
  try {
    return calculate();
  } catch {
    return null;
  }
}

export function EmployeeForm({ employee }: { employee?: EmployeeView }): ReactElement {
  const router = useRouter();
  const { error, isSubmitting, runAction } = useActionForm();
  const isEditing = !!employee;
  const [hourlyRate, setHourlyRate] = useState(employee?.hourlyRate ?? "");
  const [extraHourRate, setExtraHourRate] = useState(employee?.extraHourRate ?? "");
  const [fixedWeeklyHours, setFixedWeeklyHours] = useState(
    String(employee?.fixedWeeklyHours ?? 40)
  );

  const fixedWeeklyHoursNumber = Number(fixedWeeklyHours);
  const hasValidFixedWeeklyHours =
    Number.isFinite(fixedWeeklyHoursNumber) && fixedWeeklyHoursNumber > 0;

  const weeklyEstimate = useMemo(
    () =>
      hasValidFixedWeeklyHours
        ? calculateEstimate(() => estimateWeeklyBasePay(hourlyRate, fixedWeeklyHoursNumber))
        : null,
    [fixedWeeklyHoursNumber, hasValidFixedWeeklyHours, hourlyRate]
  );

  const monthlyEstimate = useMemo(
    () =>
      hasValidFixedWeeklyHours
        ? calculateEstimate(() => estimateMonthlyBasePay(hourlyRate, fixedWeeklyHoursNumber))
        : null,
    [fixedWeeklyHoursNumber, hasValidFixedWeeklyHours, hourlyRate]
  );

  const fourExtraHoursEstimate = useMemo(
    () => calculateEstimate(() => calculateExtraHoursPay(extraHourRate, 4)),
    [extraHourRate]
  );

  const eightExtraHoursEstimate = useMemo(
    () => calculateEstimate(() => calculateExtraHoursPay(extraHourRate, 8)),
    [extraHourRate]
  );

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: getFormString(formData, "name"),
      hourlyRate: getFormString(formData, "hourlyRate"),
      extraHourRate: getFormString(formData, "extraHourRate"),
      fixedWeeklyHours: parseInt(getFormString(formData, "fixedWeeklyHours"), 10),
    };
    const result = await runAction(() =>
      isEditing ? updateEmployee(employee.id, data) : createEmployee(data)
    );
    if (!result.ok) return;
    router.push("/employees");
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
      <FormMessage message={error} />
      <FormField htmlFor="employee-name" label={t.employees.fields.name}>
        <Input id="employee-name" name="name" required defaultValue={employee?.name} />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField htmlFor="employee-hourly-rate" label={t.employees.fields.hourlyRate}>
          <Input
            id="employee-hourly-rate"
            name="hourlyRate"
            type="number"
            step="0.01"
            required
            value={hourlyRate}
            onChange={(event) => {
              setHourlyRate(event.currentTarget.value);
            }}
          />
        </FormField>
        <FormField htmlFor="employee-hours" label={t.employees.fields.weeklyHours}>
          <Input
            id="employee-hours"
            name="fixedWeeklyHours"
            type="number"
            required
            value={fixedWeeklyHours}
            onChange={(event) => {
              setFixedWeeklyHours(event.currentTarget.value);
            }}
          />
        </FormField>
      </div>
      <div className="rounded-2xl border border-white/60 bg-white/50 px-4 py-3 text-sm text-[#526b74]">
        <p>{t.employees.weeklyEstimate(weeklyEstimate ?? "-")}</p>
        <p>{t.employees.monthlyEstimate(monthlyEstimate ?? "-")}</p>
      </div>
      <FormField htmlFor="employee-extra-hour-rate" label={t.employees.fields.extraHourRate}>
        <Input
          id="employee-extra-hour-rate"
          name="extraHourRate"
          type="number"
          step="0.01"
          required
          value={extraHourRate}
          onChange={(event) => {
            setExtraHourRate(event.currentTarget.value);
          }}
        />
      </FormField>
      <div className="rounded-2xl border border-white/60 bg-white/50 px-4 py-3 text-sm text-[#526b74]">
        <p>{t.employees.extraHoursEstimate(4, fourExtraHoursEstimate ?? "-")}</p>
        <p>{t.employees.extraHoursEstimate(8, eightExtraHoursEstimate ?? "-")}</p>
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full py-4 text-base">
        {isSubmitting ? t.common.loading : isEditing ? t.common.save : t.common.add}
      </Button>
    </form>
  );
}
