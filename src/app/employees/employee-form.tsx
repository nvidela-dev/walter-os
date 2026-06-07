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

function InfoCard({
  items,
}: {
  items: { label: string; value: string; detail?: string }[];
}): ReactElement {
  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-3xl border border-white/65 bg-white/58 shadow-[0_12px_34px_rgba(31,45,53,0.08)] backdrop-blur-xl">
      {items.map((item, index) => (
        <div
          key={item.label}
          className={`min-w-0 px-4 py-5 text-center ${
            index > 0 ? "border-l border-white/70" : ""
          }`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7d8b91]">
            {item.label}
          </p>
          <p className="mt-1 truncate text-2xl font-semibold text-[#2f3c42]">
            {item.value}
          </p>
          {item.detail != null && (
            <p className="mt-1 text-xs font-medium text-[#879399]">{item.detail}</p>
          )}
        </div>
      ))}
    </div>
  );
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
      <InfoCard
        items={[
          {
            label: t.employees.estimateLabels.weekly,
            value: weeklyEstimate != null ? `$${weeklyEstimate}` : "-",
          },
          {
            label: t.employees.estimateLabels.monthly,
            value: monthlyEstimate != null ? `$${monthlyEstimate}` : "-",
          },
        ]}
      />
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
      <InfoCard
        items={[
          {
            label: t.employees.estimateLabels.fourHours,
            value: fourExtraHoursEstimate != null ? `$${fourExtraHoursEstimate}` : "-",
            detail: t.employees.estimateLabels.extra,
          },
          {
            label: t.employees.estimateLabels.eightHours,
            value: eightExtraHoursEstimate != null ? `$${eightExtraHoursEstimate}` : "-",
            detail: t.employees.estimateLabels.extra,
          },
        ]}
      />
      <Button type="submit" disabled={isSubmitting} className="w-full py-4 text-base">
        {isSubmitting ? t.common.loading : isEditing ? t.common.save : t.common.add}
      </Button>
    </form>
  );
}
