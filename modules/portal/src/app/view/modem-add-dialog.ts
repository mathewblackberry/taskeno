import {CommonModule} from '@angular/common';
import {Component, Inject, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, Validators} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatInputModule} from '@angular/material/input';
import {Site} from '../models/model';
import {SiteEditComponent} from './site-edit.component';

@Component({
  selector: 'app-modem-add-dialog',
  standalone: true,
  imports: [SiteEditComponent, MatDialogModule, MatButtonModule, CommonModule, MatInputModule, FormsModule],
  template: `
    <h1 mat-dialog-title>Enter Serial Number</h1>
    <div mat-dialog-content>
      <mat-form-field appearance="fill">
        <mat-label>Serial Number</mat-label>
        <input matInput [(ngModel)]="serialNumber" />
      </mat-form-field>
    </div>
    <div mat-dialog-actions>
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-button (click)="onSave()">Save</button>
    </div>
  `,
  styles: [`
    mat-form-field {
      width: 100%;
    }

    mat-dialog-actions {
      display: flex;
      justify-content: flex-end;
    }

  `]

})
export class ModemAddDialogComponent implements OnInit {
  serialNumber: string

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ModemAddDialogComponent>,
  ) {}

  ngOnInit(): void {

  }

  onSave(): void {
      this.dialogRef.close(this.serialNumber);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
