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
  selector: 'app-address-list',
  standalone: true,
  imports: [
    MatTableModule, MatIconModule, CommonModule, MatPaginatorModule, MatSortModule, MatSlideToggleModule, FormsModule, MatTooltipModule, HumanReadableBytesPipe, BooleanConverterPipe
  ],
  template: `
    @if (addresses) {
      <div class="table-bar">
        <mat-slide-toggle [(ngModel)]="showAll" (change)="applyFilter()" labelPosition="after">Include Disabled Addresses</mat-slide-toggle>
        <mat-paginator [pageSizeOptions]="[10, 15, 20, 100]" [pageSize]="15" showFirstLastButtons></mat-paginator>
      </div>
      <div class="table-wrapper">
        <table mat-table multiTemplateDataRows [dataSource]="dataSource" class="mat-elevation-z8 no-header">
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let element">
              <div class="status">
                @if ((element.disabled | bool)) {
                  <mat-icon fontSet="fa" fontIcon="fa-ban" class="fa-duotone table-icon inactive" matTooltip="Disabled"></mat-icon>
                } @else {
                  <mat-icon fontSet="fa" fontIcon="fa-check" class="fa-duotone table-icon active" matTooltip="Active"></mat-icon>
                }
                @if ((element.dynamic | bool)) {
                  <mat-icon fontSet="fa" fontIcon="fa-d" class="fa-duotone table-icon" matTooltip="Dynamic"></mat-icon>
                }
              </div>
            </td>
          </ng-container>
          <ng-container matColumnDef="list">
            <th mat-header-cell *matHeaderCellDef>List</th>
            <td mat-cell *matCellDef="let element">{{ element['list'] }}</td>
          </ng-container>
          <ng-container matColumnDef="address">
            <th mat-header-cell *matHeaderCellDef>List</th>
            <td mat-cell *matCellDef="let element">{{ element['address'] }}</td>
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
      color:#1b5e20;
    }
    .table-icon.active-dark {
      color: #333;
    }
    .table-icon.inactive {
      color: #ccc;
    }
    .table-icon.warn {
      color: #b71c1c;
    }
  `]
})
export class AddresssComponent implements OnChanges {
  displayedColumns = ['status', 'list', 'address'];
  dataSource: MatTableDataSource<any> = new MatTableDataSource();
  showAll: boolean = false;
  @Input() addresses: any[]

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

   sortOrder = ['input', 'output', 'forward'];


  ngOnChanges(changes: SimpleChanges) {
    // Update the data source when the input changes
    if (changes['addresses']) {
      this.updateDataSource(changes['addresses'].currentValue);
    }
  }

  ngAfterViewInit() {
    // Initialize paginator and sort after view init
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  updateDataSource(addresses: any[]) {
    addresses = addresses.sort((a, b) => a.list.localeCompare(b.list));
    this.dataSource.data = addresses;
    this.applyFilter();
  }

  applyFilter() {
    if (this.showAll) {
      this.dataSource.filterPredicate = (data: any, filter: string) => true;
    } else {
      this.dataSource.filterPredicate = (data: any, filter: string) => !(data.disabled === 'true');
    }
    this.dataSource.filter = 'enabled';
  }
}
