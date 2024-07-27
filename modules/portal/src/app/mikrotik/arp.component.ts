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
  selector: 'app-arp-list',
  standalone: true,
  imports: [
    MatTableModule, MatIconModule, CommonModule, MatPaginatorModule, MatSortModule, MatSlideToggleModule, FormsModule, MatTooltipModule, HumanReadableBytesPipe, BooleanConverterPipe
  ],
  template: `
    @if (arps) {
      <div class="table-bar">
        <mat-slide-toggle [(ngModel)]="showAll" (change)="applyFilter()" labelPosition="after" style="margin-right: 10px;">Include Invalid Entries</mat-slide-toggle>
        <mat-paginator [pageSizeOptions]="[10, 15, 20, 100]" [pageSize]="15" showFirstLastButtons></mat-paginator>
      </div>
      <div class="table-wrapper">
        <table mat-table [dataSource]="dataSource" class="mat-elevation-z8 no-header">
          <ng-container matColumnDef="status1">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let element">
              <div class="status">
                @if ((element.disabled | bool)) {
                  <mat-icon fontSet="fa" fontIcon="fa-ban " class="fa-duotone table-icon inactive" matTooltip="Disabled"></mat-icon>
                }
                @if ((element.invalid | bool)) {
                  <mat-icon fontSet="fa" fontIcon="fa-x-mark " class="fa-duotone table-icon inactive" matTooltip="Invalid"></mat-icon>
                }
                @if ((element.dynamic | bool)) {
                  <mat-icon fontSet="fa" fontIcon="fa-d " class="fa-duotone table-icon" matTooltip="Dynamic"></mat-icon>
                }
                @if ((element.dhcp | bool)) {
                  <mat-icon fontSet="fa" fontIcon="fa-h " class="fa-duotone table-icon" matTooltip="DHCP"></mat-icon>
                }
                @if ((element.complete | bool)) {
                  <mat-icon fontSet="fa" fontIcon="fa-c " class="fa-duotone table-icon" matTooltip="Complete"></mat-icon>
                }
              </div>
            </td>
          </ng-container>
          <ng-container matColumnDef="mac">
            <th mat-header-cell *matHeaderCellDef>MAC Address</th>
            <td mat-cell *matCellDef="let element">{{ element['mac-address'] }}</td>
          </ng-container>
          <ng-container matColumnDef="ip">
            <th mat-header-cell *matHeaderCellDef>IP Address</th>
            <td mat-cell *matCellDef="let element">{{ element.address }}</td>
          </ng-container>
          <ng-container matColumnDef="interface">
            <th mat-header-cell *matHeaderCellDef>Interface</th>
            <td mat-cell *matCellDef="let element">{{ element['interface'] }}</td>
          </ng-container>
          <ng-container matColumnDef="state">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let element">{{ element.status }}</td>
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
export class ArpsComponent implements OnChanges {
  displayedColumns = ['status1','mac', 'ip', 'interface', 'state'];
  dataSource: MatTableDataSource<any> = new MatTableDataSource();
  showAll: boolean = false;
  @Input() arps: any[]

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;


  ngOnChanges(changes: SimpleChanges) {
    // Update the data source when the input changes
    if (changes['arps']) {
      this.updateDataSource(changes['arps'].currentValue);
    }
  }

  ngAfterViewInit() {
    // Initialize paginator and sort after view init
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  updateDataSource(arps: any[]) {
    this.dataSource.data = arps;
    this.applyFilter();
  }

  applyFilter() {
    if (this.showAll) {
      this.dataSource.filterPredicate = (data: any, filter: string) => true;
    } else {
      this.dataSource.filterPredicate = (data: any, filter: string) => !(data.disabled === 'true') && !(data.invalid === 'true');
    }
    this.dataSource.filter = 'enabled';
  }
}
