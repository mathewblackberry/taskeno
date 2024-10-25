import {CommonModule} from '@angular/common';
import {Component, Inject, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatNativeDateModule, provideNativeDateAdapter} from '@angular/material/core';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatInputModule} from '@angular/material/input';
import {MonthRangePickerComponent} from './date-selector.component';

@Component({
  selector: 'app-invoice-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatDialogModule,
    MatButtonModule,
    MonthRangePickerComponent,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  providers: [provideNativeDateAdapter()],
  template: `
    <h1 mat-dialog-title>Generate Invoice</h1>
    <div mat-dialog-content>
      <form [formGroup]="form">
        <app-month-range-picker (selectedDateChange)="onMonthSelected($event)" [formGroup]="form"></app-month-range-picker>

        <div class="extra">
        <mat-form-field appearance="outline" class="form-field" style="max-width: 150px">
          <mat-label>Overdue Amount</mat-label>
          <span matTextPrefix>$ &nbsp;</span>
          <input matInput type="number" formControlName="overdueAmount">
        </mat-form-field>

        <mat-form-field appearance="outline" class="form-field" style="flex: 1">
          <mat-label>Invoice Date</mat-label>
          <input matInput [matDatepicker]="invoiceDatePicker" formControlName="invoiceDate">
          <mat-datepicker-toggle matIconSuffix [for]="invoiceDatePicker"></mat-datepicker-toggle>
          <mat-datepicker #invoiceDatePicker></mat-datepicker>
        </mat-form-field>
        </div>
      </form>
    </div>
    <div mat-dialog-actions>
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-stroked-button color="primary" (click)="onSave()" [disabled]="form.invalid">Generate</button>
    </div>
  `,
  styles: [`
    .form-field {
      width: 100%;
    }

    .extra {
      display: flex;
      flex-direction: row;
      gap: 16px;
      /*max-width: 300px;*/
      margin-top: 10px;
      justify-content: center;
      width: 100%;
    }
    mat-dialog-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    mat-dialog-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 16px;
    }
  `]
})
export class DatePickerDialogComponent implements OnInit {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<DatePickerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      startDate: [null, Validators.required],
      endDate: [null, Validators.required],
      overdueAmount: [0, [Validators.required, Validators.min(0)]],
      invoiceDate: [{ value: null, disabled: false }, Validators.required]
    });
  }

  onMonthSelected(selectedDate: { start: Date; end: Date }): void {
    if (selectedDate && selectedDate.start) {
      const invoiceDate = new Date(selectedDate.start.getFullYear(), selectedDate.start.getMonth() + 1, 15);
      this.form.get('invoiceDate')?.setValue(invoiceDate.toISOString());
    }
  }

  onSave(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
