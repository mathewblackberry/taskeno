import {CommonModule} from '@angular/common';
import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {IPValidators} from '../validators/ip-cidr-validator';

@Component({
  selector: 'app-ip-list-editor',
  template: `
    <div [formGroup]="formGroup" class="form-array">
      <div [formArrayName]="component">
        @for (item of formArray.controls; let i = $index; let last = $last; track item) {
          <div class="array-item">
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <input matInput [formControlName]="i"/>
              <mat-error *ngIf="item.hasError('required')">This field is required</mat-error>
              <mat-error *ngIf="item.hasError('invalidIP')">
                @if (type.substr(0,4) === 'cidr') {
                  A valid IP address with a CIDR (/xx) is required.
                } @else {
                  A valid IP address is required.
                }
              </mat-error>
            </mat-form-field>
            @if (last) {
              <button mat-icon-button type="button" (click)="addItem()" class="add-button">
                <mat-icon>add_circle</mat-icon>
              </button>
            }
            <button mat-icon-button type="button" (click)="removeItem(i)">
              <mat-icon color="warn">remove_circle</mat-icon>
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .form-array {
      display: flex;
      flex-direction: column;
    }

    .array-item {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
    }

    mat-form-field {
      flex: 1;
      margin: 3px 0;
    }
  `],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, MatInputModule, MatIconModule, MatButtonModule]
})
export class ArrayEditorComponent implements OnChanges {
  @Input() component: string;
  @Input() type: 'ip' | 'cidr range' | 'cidr notation' = 'ip';
  @Input() formGroup: FormGroup;

  get formArray(): FormArray {
    return this.formGroup.get(this.component) as FormArray;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['formGroup']) {
      console.log('change' + this.formArray.controls.length);
      if(this.formArray.controls.length === 0) {
        this.addItem();
      }
    }
  }

  constructor(private fb: FormBuilder) {}

  addItem(): void {
    this.formArray.push(this.fb.control('', [Validators.required, IPValidators.ipCidrValidator(this.type)]));
  }

  removeItem(index: number): void {
    this.formArray.removeAt(index);
  }
}
