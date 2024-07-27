import {CommonModule} from '@angular/common';
import {Component, Input, OnChanges, SimpleChanges, ViewChild} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatIconModule} from '@angular/material/icon';
import {MatPaginator, MatPaginatorModule} from '@angular/material/paginator';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatSort, MatSortModule} from '@angular/material/sort';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import {MatTooltipModule} from '@angular/material/tooltip';
import {BooleanConverterPipe} from '../human-readable-bytes.pipe';

@Component({
  selector: 'app-routetable',
  standalone: true,
  imports: [
    MatTableModule, MatIconModule, CommonModule, MatPaginatorModule, MatSortModule, MatSlideToggleModule, FormsModule, MatTooltipModule, BooleanConverterPipe
  ],
  template: `
    @if (routes) {
      <div class="table-bar">
        <mat-slide-toggle [(ngModel)]="showAll" (change)="applyFilter()" labelPosition="after" style="margin-right: 10px;">Include Inactive Routes</mat-slide-toggle>
        <mat-paginator [pageSizeOptions]="[10, 15, 20, 100]" [pageSize]="15" showFirstLastButtons></mat-paginator>
      </div>
      <div class="table-wrapper">
        <table mat-table [dataSource]="dataSource" class="mat-elevation-z8 no-header">
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let element">
              <div class="route-status">
                @if (element.disabled | bool) {
                  <mat-icon fontSet="fa" fontIcon="fa-ban " class="fa-duotone table-icon inactive" matTooltip="Disabled"></mat-icon>
                } @else {
                  <mat-icon fontSet="fa" fontIcon="fa-wave-pulse" class="fa-duotone table-icon" [ngClass]="{'active': element.active | bool, 'inactive': !(element.active | bool)}" [matTooltip]="(element.active | bool)? 'Active' : 'Inactive'"></mat-icon>
                }
                <mat-icon fontSet="fa" fontIcon="fa-list-tree" class="fa-duotone table-icon" [ngClass]="{'active-dark': (element.ecmp | bool), 'inactive': !(element.ecmp | bool)}" [matTooltip]="(element.ecmp | bool)? 'ECMP Active' : 'No ECMP'"></mat-icon>
                @if ((element.bgp | bool)) {
                  <mat-icon fontSet="fa" fontIcon="fa-b" class="fa-duotone table-icon active-dark" matTooltip="BGP"></mat-icon>
                }
                @if ((element.ospf | bool)) {
                  <mat-icon fontSet="fa" fontIcon="fa-o" class="fa-duotone table-icon active-dark" matTooltip="OSPF"></mat-icon>
                }
                @if ((element.connect | bool)) {
                  <mat-icon fontSet="fa" fontIcon="fa-c" class="fa-duotone table-icon active-dark" matTooltip="Connected"></mat-icon>
                }
                @if ((element.static | bool)) {
                  <mat-icon fontSet="fa" fontIcon="fa-s" class="fa-duotone table-icon active-dark" matTooltip="Static"></mat-icon>
                }

              </div>
            </td>
          </ng-container>
          <ng-container matColumnDef="dst-address">
            <th mat-header-cell *matHeaderCellDef>Destination Address</th>
            <td mat-cell *matCellDef="let element">{{ element['dst-address'] }}</td>
          </ng-container>
          <ng-container matColumnDef="gateway">
            <th mat-header-cell *matHeaderCellDef>Gateway</th>
            <td mat-cell *matCellDef="let element">{{ element.gateway }}</td>
          </ng-container>
          <ng-container matColumnDef="distance">
            <th mat-header-cell *matHeaderCellDef>Distance</th>
            <td mat-cell *matCellDef="let element">{{ element.distance }}</td>
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

    .route-status {
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
export class RoutetableComponent implements OnChanges {
  displayedColumns = ['status','dst-address', 'gateway', 'distance'];
  dataSource: MatTableDataSource<any> = new MatTableDataSource();
  showAll: boolean = false;
  @Input() routes: any[]

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;


  ngOnChanges(changes: SimpleChanges) {
    // Update the data source when the input changes
    if (changes['routes']) {
      this.updateDataSource(changes['routes'].currentValue);
    }
  }

  ngAfterViewInit() {
    // Initialize paginator and sort after view init
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  updateDataSource(routes: any[]) {
    this.dataSource.data = routes;
    this.applyFilter();
  }

  applyFilter() {
    if (this.showAll) {
      this.dataSource.filterPredicate = (data: any, filter: string) => true;
    } else {
      this.dataSource.filterPredicate = (data: any, filter: string) => data.active === 'true';
    }
    this.dataSource.filter = 'enabled'; // Trigger filtering
  }

  toBoolean(value: string): boolean {
    return value === 'true';
  }
}
