import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { employees, extraHours } from "@/db/schema";
import type { EmployeeDetail, EmployeeView, ExtraHourView } from "@/lib/types/employees";
import { parseUuidOrNull } from "@/lib/validation";

const employeeSelection = {
  id: employees.id,
  name: employees.name,
  hourlyRate: employees.hourlyRate,
  extraHourRate: employees.extraHourRate,
  fixedWeeklyHours: employees.fixedWeeklyHours,
};

export async function getEmployees(): Promise<EmployeeView[]> {
  return db.select(employeeSelection).from(employees).orderBy(employees.name);
}

export async function getEmployee(id: string): Promise<EmployeeView | null> {
  const parsedId = parseUuidOrNull(id);
  if (parsedId === null) return null;

  const [employee] = await db
    .select(employeeSelection)
    .from(employees)
    .where(eq(employees.id, parsedId));
  return employee ?? null;
}

export async function getEmployeeWithHours(id: string): Promise<EmployeeDetail | null> {
  const employee = await getEmployee(id);
  if (!employee) return null;

  const hours: ExtraHourView[] = await db
    .select({
      id: extraHours.id,
      employeeId: extraHours.employeeId,
      date: extraHours.date,
      hours: extraHours.hours,
      amountPaid: extraHours.amountPaid,
    })
    .from(extraHours)
    .where(eq(extraHours.employeeId, employee.id));

  return { ...employee, extraHours: hours };
}
