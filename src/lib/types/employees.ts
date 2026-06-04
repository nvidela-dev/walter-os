export interface EmployeeView {
  id: string;
  name: string;
  monthlySalary: string;
  fixedWeeklyHours: number;
}

export interface ExtraHourView {
  id: string;
  employeeId: string;
  date: string;
  hours: number;
  amountPaid: string;
}

export interface EmployeeDetail extends EmployeeView {
  extraHours: ExtraHourView[];
}
