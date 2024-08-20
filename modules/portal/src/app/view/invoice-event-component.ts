import {CommonModule} from '@angular/common';
import {Component, Inject, OnInit} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatNativeDateModule, provideNativeDateAdapter} from '@angular/material/core';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {InvoiceEvent, Rate} from '../models/model';
import {SiteAssetService} from '../services/site-asset-service';

@Component({
  selector: 'app-invoice-event-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  providers: [provideNativeDateAdapter()],
  template: `
    <h1 mat-dialog-title>{{ invoiceEventForm.get('eventType')?.value === 'ACTIVATE' ? 'Activate Asset' : 'Deactivate Asset' }}</h1>
    <div mat-dialog-content>
      <form [formGroup]="invoiceEventForm" class="form">
        <mat-form-field appearance="outline">
          <mat-label>When</mat-label>
          <input matInput formControlName="timestamp" [matDatepicker]="picker">
          <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>

        @if (data.activate) {
          <mat-form-field appearance="outline">
            <mat-label>Rate</mat-label>
            <mat-select (selectionChange)="onRateChange($event.value)">
              <mat-option *ngFor="let rate of rates" [value]="rate">{{ rate.name }}</mat-option>
            </mat-select>
          </mat-form-field>

          <div formGroupName="rate">
            @if (invoiceEventForm.get('rate.id')?.value) {
              <mat-form-field appearance="outline">
                <mat-label>Description</mat-label>
                <input matInput formControlName="name" required>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Upfront Cost</mat-label>
                <input matInput type="number" formControlName="upfront" required>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Ongoing Cost</mat-label>
                <input matInput type="number" formControlName="ongoing" required>
              </mat-form-field>
            }
          </div>
        }
      </form>
    </div>
    <div mat-dialog-actions>
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-button color="primary" (click)="onSubmit()" [disabled]="invoiceEventForm.invalid">Submit</button>
    </div>
  `,
  styles: [
    `
      mat-form-field {
        width: 100%;
      }

      .form {
        width: 100%;
        padding-top: 8px;
      }

      .mat-dialog-actions {
        display: flex;
        justify-content: space-between;
      }
    `
  ]
})
export class InvoiceEventDialogComponent implements OnInit {

  invoiceEventForm: FormGroup;
  rates: Rate[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<InvoiceEventDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { siteId: string, assetId: string, activate: boolean, rates: Rate[] },
    private service: SiteAssetService
  ) {
    const timestamp = new Date();
    if (data.activate) {
      timestamp.setHours(0, 0, 0, 0); // Midnight
    } else {
      timestamp.setHours(23, 59, 59, 999); // 23:59:59:999
    }

    this.invoiceEventForm = this.fb.group({
      eventType: [data.activate ? 'ACTIVATED' : 'DEACTIVATED', Validators.required],
      timestamp: [timestamp.toISOString(), Validators.required],
      ...(data.activate && {
        rate: this.fb.group({
          id: data.activate ? ['', Validators.required] : [''],
          name: ['', Validators.required],
          upfront: [0, [Validators.required, Validators.min(0)]],
          ongoing: [0, [Validators.required, Validators.min(0)]]
        })
      })
    });
    this.rates = data.rates;
  }

  ngOnInit(): void {
    this.invoiceEventForm.get('timestamp')?.valueChanges.subscribe((date: string) => {
      this.updateTime(date);
    });
  }

  updateTime(date: string): void {
    const selectedDate = new Date(date);
    if (this.data.activate) {
      selectedDate.setHours(0, 0, 0, 0); // Reset to midnight
    } else {
      selectedDate.setHours(23, 59, 59, 999); // Reset to 23:59:59:999
    }
    this.invoiceEventForm.get('timestamp')?.setValue(selectedDate.toISOString(), {emitEvent: false});
  }

  get rateForm(): FormGroup {
    return this.invoiceEventForm.get('rate') as FormGroup;
  }

  onRateChange(rate: Rate): void {
    this.invoiceEventForm.patchValue({
      rate: {
        id: rate.id,
        name: rate.name,
        upfront: rate.upfront,
        ongoing: rate.ongoing
      }
    });
  }

  onSubmit(): void {
    if (this.invoiceEventForm.valid) {
      const invoiceEvent: InvoiceEvent = this.invoiceEventForm.value;
      console.log(this.invoiceEventForm.value);
      if (this.data.activate) {
        this.service.activateRouter(this.data.siteId, this.data.assetId, invoiceEvent)
          .subscribe(result => {
            this.dialogRef.close(result);
          });
      } else {
        this.service.deactivateRouter(this.data.siteId, this.data.assetId, invoiceEvent)
          .subscribe(result => {
            this.dialogRef.close(result);
          });
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
