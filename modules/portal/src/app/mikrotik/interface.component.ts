import {CommonModule} from '@angular/common';
import {Component, Input, OnChanges, SimpleChanges, ViewChild} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatIconModule} from '@angular/material/icon';
import {MatPaginator, MatPaginatorModule} from '@angular/material/paginator';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatSort, MatSortModule} from '@angular/material/sort';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import {MatTooltipModule} from '@angular/material/tooltip';
import {BooleanConverterPipe, HumanReadableBytesPipe} from '../human-readable-bytes.pipe';

@Component({
  selector: 'app-interface-list',
  standalone: true,
  imports: [
    MatTableModule, MatIconModule, CommonModule, MatPaginatorModule, MatSortModule, MatSlideToggleModule, FormsModule, MatTooltipModule, HumanReadableBytesPipe, BooleanConverterPipe
  ],
  template: `
    @if (interfaces) {
      <div class="table-bar">
        <mat-slide-toggle [(ngModel)]="showAll" (change)="applyFilter()" labelPosition="after" style="margin-right: 10px;">Include Inactive Interfaces</mat-slide-toggle>
        <mat-paginator [pageSizeOptions]="[10, 15, 20, 100]" [pageSize]="15" showFirstLastButtons></mat-paginator>
      </div>
      <div class="table-wrapper">
        <table mat-table [dataSource]="dataSource" class="mat-elevation-z8 no-header">
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let element">
              <div class="status">
                @if ((element.disabled | bool)) {
                  <mat-icon fontSet="fa" fontIcon="fa-ban " class="fa-duotone table-icon inactive" matTooltip="Disabled"></mat-icon>
                } @else {
                  @if ((element.running | bool)) {
                    <mat-icon fontSet="fa" fontIcon="fa-up" class="fa-duotone table-icon active" matTooltip="Active"></mat-icon>
                  } @else {
                    <mat-icon fontSet="fa" fontIcon="fa-down" class="fa-duotone table-icon inactive" matTooltip="Inactive"></mat-icon>
                  }
                }
                @switch (element.type) {
                  @case ('ether') {
                    <mat-icon fontSet="fa" fontIcon="fa-ethernet" class="fa-duotone table-icon" [ngClass]="{'active': (element.running | bool), 'inactive': !(element.running | bool)}" matTooltip="Ethernet"></mat-icon>
                  }
                  @case ('loopback') {
                    <mat-icon fontSet="fa" fontIcon="fa-router" class="fa-duotone table-icon" [ngClass]="{'active': (element.running | bool), 'inactive': !(element.running | bool)}" matTooltip="Loopback"></mat-icon>
                  }
                  @case ('bridge') {
                    <mat-icon fontSet="fa" fontIcon="fa-bridge-suspension" class="fa-duotone table-icon" [ngClass]="{'active': (element.running | bool), 'inactive': !(element.running | bool)}" matTooltip="Bridge"></mat-icon>
                  }
                  @case ('lte') {
                    <mat-icon fontSet="fa" fontIcon="fa-signal" class="fa-duotone table-icon" [ngClass]="{'active': (element.running | bool), 'inactive': !(element.running | bool)}" matTooltip="LTE"></mat-icon>
                  }

                }
              </div>
            </td>
          </ng-container>
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Interface Name</th>
            <td mat-cell *matCellDef="let element">{{ element['name'] }}</td>
          </ng-container>
          <ng-container matColumnDef="type">
            <th mat-header-cell *matHeaderCellDef>Type</th>
            <td mat-cell *matCellDef="let element">{{ element.type }}</td>
          </ng-container>
          <ng-container matColumnDef="mac">
            <th mat-header-cell *matHeaderCellDef>Mac Address</th>
            <td mat-cell *matCellDef="let element">{{ element['mac-address'] }}</td>
          </ng-container>
          <ng-container matColumnDef="last-uptime">
            <th mat-header-cell *matHeaderCellDef>Last Link Up</th>
            <td mat-cell *matCellDef="let element">{{ element['last-link-up-time]'] }}</td>
          </ng-container>
          <ng-container matColumnDef="link-downs">
            <th mat-header-cell *matHeaderCellDef>Link Drops</th>
            <td mat-cell *matCellDef="let element">{{ element['link-downs'] }}</td>
          </ng-container>
          <ng-container matColumnDef="rx">
            <th mat-header-cell *matHeaderCellDef>RX</th>
            <td mat-cell *matCellDef="let element"><span [matTooltip]="element['rx-byte']">{{ element['rx-byte'] | humanReadableBytes }}</span></td>
          </ng-container>
          <ng-container matColumnDef="tx">
            <th mat-header-cell *matHeaderCellDef>TX</th>
            <td mat-cell *matCellDef="let element"><span [matTooltip]="element['tx-byte']">{{ element['tx-byte'] | humanReadableBytes }}</span></td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>

      </div>
    }
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      height: 100%;
    }

    .status {
      display: flex;
      align-items: center;
    }
    .table-icon {
      width: auto;
      height: auto;
      font-size: 16px;
      margin-right: 3px;
      padding: 2px;
    }
    .table-icon.active {
      color: #1b5e20;
    }
    .table-icon.active-dark {
      color: #333;
    }
    .table-icon.inactive {
      color: #ccc;
    }

  `]
})
export class InterfacesComponent implements OnChanges {
  displayedColumns = ['status','name', 'type', 'mac', 'last-uptime', 'link-downs', 'rx', 'tx'];
  dataSource: MatTableDataSource<any> = new MatTableDataSource();
  showAll: boolean = false;
  @Input() interfaces: any[]

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;


  ngOnChanges(changes: SimpleChanges) {
    // Update the data source when the input changes
    if (changes['interfaces']) {
      this.updateDataSource(changes['interfaces'].currentValue);
    }
  }

  ngAfterViewInit() {
    // Initialize paginator and sort after view init
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  updateDataSource(interfaces: any[]) {
    this.dataSource.data = interfaces;
    this.applyFilter();
  }

  applyFilter() {
    if (this.showAll) {
      this.dataSource.filterPredicate = (data: any, filter: string) => true;
    } else {
      this.dataSource.filterPredicate = (data: any, filter: string) => data.running === 'true';
    }
    this.dataSource.filter = 'enabled';
  }
}
