import { Component, EventEmitter, OnInit, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-month-range-picker',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatSelectModule,
    MatButtonModule,
    MatInputModule,
    MatCardModule,
  ],
  template: `
    <div class="month-picker-container">
      <mat-form-field appearance="outline" class="form-field" style="flex:1;">
        <mat-label>Month</mat-label>
        <mat-select [(value)]="selectedMonth" (selectionChange)="onDateChange()">
          <mat-option *ngFor="let month of months" [value]="month.value">
            {{ month.viewValue }}
          </mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline" class="form-field" style="max-width: 120px;">
        <mat-label>Year</mat-label>
        <input matInput type="number" [(ngModel)]="selectedYear" (ngModelChange)="onDateChange()" [min]="minYear" [max]="maxYear">
      </mat-form-field>
    </div>
  `,
  styles: [`
    .month-picker-container {
      display: flex;
      flex-direction: row;
      gap: 16px;
      margin-top: 10px;
      justify-content: center;
      width: 100%;
    }

    @media (min-width: 600px) {
      .form-field {
        max-width: 600px;
      }
    }
  `]
})
export class MonthRangePickerComponent implements OnInit {
  @Input() formGroup: FormGroup;  // FormGroup passed from parent component
  @Output() selectedDateChange = new EventEmitter<{ start: Date; end: Date }>();

  minYear: number;
  maxYear: number;

  selectedMonth: number;
  selectedYear: number;
  dateRange: { start: Date, end: Date };

  months = [
    { value: 0, viewValue: 'January' },
    { value: 1, viewValue: 'February' },
    { value: 2, viewValue: 'March' },
    { value: 3, viewValue: 'April' },
    { value: 4, viewValue: 'May' },
    { value: 5, viewValue: 'June' },
    { value: 6, viewValue: 'July' },
    { value: 7, viewValue: 'August' },
    { value: 8, viewValue: 'September' },
    { value: 9, viewValue: 'October' },
    { value: 10, viewValue: 'November' },
    { value: 11, viewValue: 'December' },
  ];

  ngOnInit() {
    const currentDate = new Date();
    this.minYear = currentDate.getFullYear() - 1;
    this.maxYear = currentDate.getFullYear();

    const previousMonth = currentDate.getMonth() === 0 ? 11 : currentDate.getMonth() - 1;
    const previousYear = currentDate.getMonth() === 0 ? currentDate.getFullYear() - 1 : currentDate.getFullYear();

    this.selectedMonth = previousMonth;
    this.selectedYear = previousYear;

    this.onDateChange();
  }

  onDateChange() {
    if (this.selectedMonth != null && this.selectedYear != null) {
      const startDate = new Date(this.selectedYear, this.selectedMonth, 1, 0, 0, 0, 0);
      const endDate = new Date(this.selectedYear, this.selectedMonth + 1, 0, 23, 59, 59, 999);

      this.dateRange = { start: startDate, end: endDate };
      this.selectedDateChange.emit(this.dateRange);  // Emit the selected date range

      // Update the FormGroup with the new dates
      this.formGroup.patchValue({
        startDate: startDate,
        endDate: endDate
      });
    }
  }
}
