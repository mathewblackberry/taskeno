import { Component, Input } from '@angular/core';
import {FormGroup, ReactiveFormsModule} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-site-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule
  ],
  template: `
    <form [formGroup]="siteForm" class="site-form">
      <mat-form-field appearance="outline" class="form-field">
        <mat-label>Name</mat-label>
        <input matInput formControlName="name">
        <mat-error *ngIf="siteForm.get('name')?.invalid">{{ getErrorMessage('name') }}</mat-error>
      </mat-form-field>

      <mat-form-field appearance="outline" class="form-field">
        <mat-label>Address</mat-label>
        <input matInput formControlName="address">
        <mat-error *ngIf="siteForm.get('address')?.invalid">{{ getErrorMessage('address') }}</mat-error>
      </mat-form-field>

      <mat-form-field appearance="outline" class="form-field">
        <mat-label>Address 2</mat-label>
        <input matInput formControlName="address2">
      </mat-form-field>

      <mat-form-field appearance="outline" class="form-field">
        <mat-label>City</mat-label>
        <input matInput formControlName="city">
        <mat-error *ngIf="siteForm.get('city')?.invalid">{{ getErrorMessage('city') }}</mat-error>
      </mat-form-field>

      <mat-form-field appearance="outline" class="form-field">
        <mat-label>State</mat-label>
        <input matInput formControlName="state">
        <mat-error *ngIf="siteForm.get('state')?.invalid">{{ getErrorMessage('state') }}</mat-error>
      </mat-form-field>

      <mat-form-field appearance="outline" class="form-field">
        <mat-label>Postcode</mat-label>
        <input matInput formControlName="postcode">
        <mat-error *ngIf="siteForm.get('postcode')?.invalid">{{ getErrorMessage('postcode') }}</mat-error>
      </mat-form-field>

      <mat-form-field appearance="outline" class="form-field">
        <mat-label>Phone</mat-label>
        <input matInput formControlName="phone">
        <mat-error *ngIf="siteForm.get('phone')?.invalid">{{ getErrorMessage('phone') }}</mat-error>
      </mat-form-field>

      <mat-form-field appearance="outline" class="form-field">
        <mat-label>Email</mat-label>
        <input matInput formControlName="email">
        <mat-error *ngIf="siteForm.get('email')?.invalid">{{ getErrorMessage('email') }}</mat-error>
      </mat-form-field>

      <mat-form-field appearance="outline" class="form-field">
        <mat-label>Latitude</mat-label>
        <input matInput formControlName="latitude">
        <mat-error *ngIf="siteForm.get('latitude')?.invalid">{{ getErrorMessage('latitude') }}</mat-error>
      </mat-form-field>

      <mat-form-field appearance="outline" class="form-field">
        <mat-label>Longitude</mat-label>
        <input matInput formControlName="longitude">
        <mat-error *ngIf="siteForm.get('longitude')?.invalid">{{ getErrorMessage('longitude') }}</mat-error>
      </mat-form-field>

      <mat-checkbox formControlName="active">Active</mat-checkbox>

    </form>
  `,
  styles: [`
    .site-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-field {
      width: 100%;
    }

    @media (min-width: 600px) {
      .form-field {
        max-width: 600px;
      }
    }
  `]
})
export class SiteEditComponent {
  @Input() siteForm: FormGroup;

  getErrorMessage(field: string): string {
    const control = this.siteForm.get(field);
    if (control?.hasError('required')) {
      return `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
    }
    if (control?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    if (control?.hasError('pattern')) {
      return 'Please enter a valid phone number';
    }
    return '';
  }
}
