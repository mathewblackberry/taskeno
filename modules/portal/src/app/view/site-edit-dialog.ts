import {CommonModule} from '@angular/common';
import {Component, Inject, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {Site} from '../models/model';
import {SiteEditComponent} from './site-edit.component';

@Component({
  selector: 'app-site-edit-dialog',
  standalone: true,
  imports: [SiteEditComponent, MatDialogModule, MatButtonModule, CommonModule],
  template: `
    <h1 mat-dialog-title>Edit Site</h1>
    <div mat-dialog-content>
      <app-site-edit [siteForm]="siteForm"></app-site-edit>
    </div>
    <div mat-dialog-actions>
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-button (click)="onSave()" [disabled]="siteForm.invalid">Save</button>
    </div>
  `
})
export class SiteEditDialogComponent implements OnInit {
  siteForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<SiteEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Site // Inject the data passed to the dialog
  ) {}

  ngOnInit(): void {
    this.siteForm = this.fb.group({
      id: [this.data?.id || '', Validators.required],
      name: [this.data?.name || '', Validators.required],
      address: [this.data?.address || '', Validators.required],
      address2: [this.data?.address2 || ''],
      city: [this.data?.city || '', Validators.required],
      state: [this.data?.state || '', Validators.required],
      postcode: [this.data?.postcode || '', Validators.required],
      phone: [this.data?.phone || '', [Validators.required, Validators.pattern(/^(\+61[1-9]\d{8}|0\d{9})$/)]],
      email: [this.data?.email || '', [Validators.email]],
      longitude: [this.data?.longitude || ''],
      latitude: [this.data?.latitude || ''],
      active: [this.data?.active || false, Validators.required]
    });
  }

  onSave(): void {
    if (this.siteForm.valid) {
      this.dialogRef.close(this.siteForm.value);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
