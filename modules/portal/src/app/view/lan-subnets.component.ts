import {CommonModule} from '@angular/common';
import {AfterViewInit, ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output, QueryList, ViewChildren} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatExpansionModule, MatExpansionPanel} from '@angular/material/expansion';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatTableModule} from '@angular/material/table';
import {IPv4CidrRange} from 'ip-num';
import {Validator as IPValidator} from 'ip-num/Validator';
import {debounceTime, distinctUntilChanged, subscribeOn, Subscription} from 'rxjs';
import {Asset, Host} from '../models/model';
import {PasswordFieldComponent} from '../password-field.component';
import {IPValidators} from '../validators/ip-cidr-validator';

@Component({
  selector: 'app-lan-subnets',
  standalone: true,
  imports: [
    MatTableModule, MatExpansionModule, MatIconModule, CommonModule, FormsModule, MatInputModule, PasswordFieldComponent, ReactiveFormsModule, MatButtonModule, MatCheckboxModule,
    MatExpansionModule
  ],
  template: `

    <form [formGroup]="formGroup">
      @if (isEditMode) {
        <button mat-icon-button (click)="addItem()">
          <mat-icon>add</mat-icon>
        </button>
      }
      <div formArrayName="lanSubnets">

        <mat-accordion class="headers-align" [multi]="false">
          @for (item of lanSubnets.controls; let si = $index; let last = $last; let first = $first; track item) {
            <mat-expansion-panel [expanded]="panelState[si]">
              <mat-expansion-panel-header>
                <mat-panel-title>Subnet: {{ si + 1 }}</mat-panel-title>
                <mat-panel-description>
                  {{ getSubnet(si).get('subnet')?.value }}
                </mat-panel-description>
              </mat-expansion-panel-header>
              <div [formGroupName]="si">
                @if (isEditMode) {
                  <mat-form-field appearance="outline" class="subnet" subscriptSizing="dynamic">
                    <mat-label>Subnet(with CIDR)</mat-label>
                    <input matInput formControlName="subnet"/>
                    <mat-error *ngIf="getSubnet(si).get('subnet')?.hasError('required')">Name is required</mat-error>
                    <mat-error *ngIf="getSubnet(si).get('subnet')?.hasError('minlength')">Minimum length is {{ getSubnet(si).get('subnet')?.getError('minlength').requiredLength }}</mat-error>
                    <mat-error *ngIf="getSubnet(si).get('subnet')?.hasError('maxlength')">Maximum length is {{ getSubnet(si).get('subnet')?.getError('maxlength').requiredLength }}</mat-error>
                    <mat-error *ngIf="getSubnet(si).get('subnet')?.hasError('pattern')">Invalid format</mat-error>
                    <mat-error *ngIf="getSubnet(si).get('subnet')?.hasError('invalidIP')">A valid network address range with a CIDR (/xx) is required.</mat-error>
                  </mat-form-field>
                }
                <div class="hosts-container" [formArrayName]="'hosts'">
                  <!-- Header Row -->
                  <div class="header-row">
                    <div class="header-cell ip-column">IP</div>
                    <div class="header-cell name-column">Name</div>
                    <div class="header-cell active-column">Active</div>
                  </div>

                  <!-- Data Rows -->
                  @for (element of getHosts(si).controls; let i = $index; let first = $first; let last = $last; track element) {
                    <div [formGroupName]="i" class="data-row" [ngClass]="{'network-row': first || last}">
                      <div class="data-cell ip-column">
                        <strong>{{ getHosts(si).at(i).get('ip')?.value }}</strong>
                      </div>

                      <div class="data-cell name-column">
                        @if (isEditMode && !first && !last) {
                          <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
                            <input matInput formControlName="name"/>
                            <mat-error *ngIf="getHosts(si).at(i).get('name')?.hasError('required')">Name is required</mat-error>
                            <mat-error *ngIf="getHosts(si).at(i).get('name')?.hasError('minlength')">
                              Minimum length is {{ getHosts(si).at(i).get('name')?.getError('minlength').requiredLength }}
                            </mat-error>
                            <mat-error *ngIf="getHosts(si).at(i)?.get('name')?.hasError('maxlength')">
                              Maximum length is {{ getHosts(si).at(i).get('name')?.getError('maxlength').requiredLength }}
                            </mat-error>
                            <mat-error *ngIf="getHosts(si).at(i)?.get('name')?.hasError('pattern')">Invalid format</mat-error>
                          </mat-form-field>
                        } @else {
                          {{ getHosts(si).at(i).get('name')?.value }}
                        }
                      </div>

                      <div class="data-cell active-column">
                        @if (isEditMode && !first && !last) {
                          <mat-checkbox formControlName="active"></mat-checkbox>
                          <mat-error *ngIf="getHosts(si).at(i)?.get('active')?.hasError('required')">Active status is required</mat-error>
                        } @else {
                          @if (getHosts(si).at(i).get('active')?.value) {
                            <mat-icon>check</mat-icon>
                          } @else {
                            <mat-icon>close</mat-icon>
                          }
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>
            </mat-expansion-panel>
          }
        </mat-accordion>
      </div>
    </form>
  `,
  styleUrl: './view.scss',
  styles: [`

  `]
})
export class LanSubnetsComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() displayedColumns: string[] = ['ip', 'name', 'active'];
  @Input({required: true}) selectedAsset: Asset
  @Input({required: true}) formGroup: FormGroup;
  @Input() isEditMode: boolean = false;
  @ViewChildren(MatExpansionPanel) expansionPanels: QueryList<MatExpansionPanel>;
  @Output() update: EventEmitter<void> = new EventEmitter<void>();
  panelState: boolean[] = [];

  subscriptions: Subscription[] = [];

  get lanSubnets(): FormArray {
    return this.formGroup.get('lanSubnets') as FormArray;
  }

  ngOnInit(): void {
    this.lanSubnets.controls.forEach((control, index) => {
      const sub = control.get('subnet')?.statusChanges.pipe(
        debounceTime(500),
        distinctUntilChanged()).subscribe(status => {
        if (status === 'VALID') {
          this.onSubnetBlur(index);
        }
      });
      this.subscriptions.push(sub!);
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  ngAfterViewInit(): void {
    // Initially expand the first panel
    if (this.expansionPanels.length) {
      this.panelState[0] = true;
    }
  }

  getHosts(id: number): FormArray {
    return this.lanSubnets.at(id).get('hosts') as FormArray;
  }

  getSubnet(id: number): FormGroup {
    return this.lanSubnets.at(id) as FormGroup;
  }

  constructor(private fb: FormBuilder, private cdRef: ChangeDetectorRef) {
  }

  addItem(): void {
    this.lanSubnets.push(this.fb.group({
      subnet: ['', [Validators.required, IPValidators.ipCidrValidator('cidr range')]],
      hosts: this.fb.array(this.createHostArray([]))
    }));
    this.panelState.push(true);
    this.panelState = this.panelState.map((state, index) => index === this.panelState.length - 1);

    this.ngOnDestroy();
    this.ngOnInit();

  }

  createHostArray(hosts: Host[]): FormGroup[] {
    return hosts.map(host => this.fb.group({
      ip: [host.ip.toString(), Validators.required],
      name: [host.name],
      active: [host.active]
    }));
  }

  removeItem(index: number): void {
    this.lanSubnets.removeAt(index);
  }

  save(): void {
    console.log(JSON.stringify(this.formGroup.value, null, 2));
    this.update.emit();
  }

  onSubnetBlur(index: number) {
    const subnetControl = this.formGroup.get(['lanSubnets', index, 'subnet']);
    const subnetValue = subnetControl?.value;

    const valid = IPValidator.isValidIPv4CidrRange(subnetValue);
    if (!valid[0]) return;

    try {
      const cidr = IPv4CidrRange.fromCidr(subnetValue);
      const hostsFormArray = this.formGroup.get(['lanSubnets', index, 'hosts']) as FormArray;
      const ipList = this.getIpRange(cidr);
      this.updateHostsArray(hostsFormArray, ipList, cidr);
    } catch (error) {
    }
  }

  getIpRange(cidr: IPv4CidrRange): string[] {
    const start = cidr.getFirst();
    const end = cidr.getLast();
    const ipList: string[] = [];
    let current = start;

    while (current.isLessThanOrEquals(end)) {
      ipList.push(current.toString());
      current = current.nextIPNumber();
    }

    return ipList;
  }

  updateHostsArray(hostsFormArray: FormArray, ipList: string[], cidr: IPv4CidrRange) {
    const existingHostsMap = new Map<string, FormGroup>();
    hostsFormArray.controls.forEach((control, index) => {
      if (index === 0) {
        control.get('name')?.setValue('');
        control.get('active')?.setValue(false);
      }

      if (index === hostsFormArray.controls.length - 1) {
        control.get('name')?.setValue('');
        control.get('active')?.setValue(false);
      }
      existingHostsMap.set(control.get('ip')?.value, control as FormGroup);
    });

    const newHosts: FormGroup[] = [];
    ipList.forEach((ip, index) => {
      let hostGroup: FormGroup | undefined = existingHostsMap.get(ip);
      if (!hostGroup) {
        hostGroup = this.fb.group({
          ip: [ip, [Validators.required, IPValidators.ipCidrValidator('ip')]],
          name: [hostsFormArray.at(index)?.get('name')?.value || ''],
          active: [hostsFormArray.at(index)?.get('active')?.value || false]
        });
      }

      if (ip === cidr.getFirst().toString()) {
        hostGroup.patchValue({name: 'Network Address', active: true});
      } else if (ip === cidr.getLast().toString()) {
        hostGroup.patchValue({name: 'Broadcast Address', active: true});
      }
      newHosts.push(hostGroup);
    });

    hostsFormArray.clear();
    newHosts.forEach(host => hostsFormArray.push(host));
  }
}
