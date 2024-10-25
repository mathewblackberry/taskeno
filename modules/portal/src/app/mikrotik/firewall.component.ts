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
  selector: 'app-firewall-list',
  standalone: true,
  imports: [
    MatTableModule, MatIconModule, CommonModule, MatPaginatorModule, MatSortModule, MatSlideToggleModule, FormsModule, MatTooltipModule, HumanReadableBytesPipe, BooleanConverterPipe
  ],
  template: `
    @if (firewalls) {
      <!--      <div class="wrapper">-->
      <div class="table-bar">
        <mat-slide-toggle [(ngModel)]="showAll" (change)="applyFilter()" labelPosition="after">Include Dynamic & Disabled Rules</mat-slide-toggle>
        <mat-paginator [pageSizeOptions]="[5, 10, 15, 20, 100]" [pageSize]="5" showFirstLastButtons></mat-paginator>
      </div>
      <div class="table-wrapper">
        <table mat-table multiTemplateDataRows [dataSource]="dataSource" class="mat-elevation-z8 no-header">
          <ng-container matColumnDef="status">
            <td mat-cell *matCellDef="let element">
              <div class="status">
                @if ((element.disabled | bool)) {
                  <mat-icon fontSet="fa" fontIcon="fa-ban " class="fa-duotone table-icon inactive" matTooltip="Disabled"></mat-icon>
                }
                @if ((element.dynamic | bool)) {
                  <mat-icon fontSet="fa" fontIcon="fa-d " class="fa-duotone table-icon" matTooltip="Dynamic"></mat-icon>
                }
                @switch (element.action) {
                  @case ('accept') {
                    <mat-icon fontSet="fa" fontIcon="fa-shield-check" class="fa-duotone table-icon active" matTooltip="Accept"></mat-icon>
                  }
                  @case ('drop') {
                    <mat-icon fontSet="fa" fontIcon="fa-shield-xmark" class="fa-duotone table-icon warn" matTooltip="Drop"></mat-icon>
                  }
                  @case ('reject') {
                    <mat-icon fontSet="fa" fontIcon="fa-shield-xmark" class="fa-duotone table-icon warn" matTooltip="Reject"></mat-icon>
                  }
                  @case ('passthrough') {
                    <mat-icon fontSet="fa" fontIcon="fa-arrow-right-from-line" class="fa-duotone table-icon active" matTooltip="Passthrough"></mat-icon>
                  }
                  @case ('fasttrack-connection') {
                    <mat-icon fontSet="fa" fontIcon="fa-arrow-right" class="fa-duotone table-icon active" matTooltip="Fast Track"></mat-icon>
                  }
                }

                @switch (element.chain) {
                  @case ('input') {
                    <mat-icon fontSet="fa" fontIcon="fa-arrow-down-to-arc" class="fa-duotone table-icon active" matTooltip="Input Chain"></mat-icon>
                  }
                  @case ('output') {
                    <mat-icon fontSet="fa" fontIcon="fa-arrow-up-from-arc" class="fa-duotone table-icon active" matTooltip="Output Chain"></mat-icon>
                  }
                  @case ('forward') {
                    <mat-icon fontSet="fa" fontIcon="fa-arrow-down-up-lock" class="fa-duotone table-icon active" matTooltip="Forward Chain"></mat-icon>
                  }
                }
              </div>
            </td>
          </ng-container>
          <ng-container matColumnDef="comment">
            <!--            <th colspan="6" mat-header-cell *matHeaderCellDef>Comment</th>-->
            <td colspan="6" mat-cell *matCellDef="let element">{{ element['comment'] }}</td>
          </ng-container>
          <ng-container matColumnDef="in">
            <th mat-header-cell *matHeaderCellDef>From</th>
            <td mat-cell *matCellDef="let element">
              @if (element['in-interface']) {
                {{ element['in-interface'] }}
              } @else if (element['in-interface-list']) {
                {{ element['in-interface-list'] }}
              } @else {
                ANY
              }
            </td>
          </ng-container>
          <ng-container matColumnDef="out">
            <th mat-header-cell *matHeaderCellDef>To</th>
            <td mat-cell *matCellDef="let element">
              @if (element['out-interface']) {
                {{ element['out-interface'] }}
              } @else if (element['out-interface-list']) {
                {{ element['out-interface-list'] }}
              } @else {
                ANY
              }
            </td>
          </ng-container>
          <ng-container matColumnDef="src">
            <th mat-header-cell *matHeaderCellDef>Src Address</th>
            <td mat-cell *matCellDef="let element">
              @if (element['src-address']) {
                {{ element['src-address'] }}
              } @else if (element['src-address-list']) {
                {{ element['src-address-list'] }}
              } @else {
                all
              }
            </td>
          </ng-container>
          <ng-container matColumnDef="dst">
            <th mat-header-cell *matHeaderCellDef>Dst Address</th>
            <td mat-cell *matCellDef="let element">
              @if (element['dst-address']) {
                {{ element['dst-address'] }}
              } @else if (element['dst-address-list']) {
                {{ element['dst-address-list'] }}
              } @else {
                all
              }
            </td>
          </ng-container>
          <ng-container matColumnDef="protocol">
            <th mat-header-cell *matHeaderCellDef>Prot.</th>
            <td mat-cell *matCellDef="let element">{{ element['protocol'] }}</td>
          </ng-container>
          <ng-container matColumnDef="dst-port">
            <th mat-header-cell *matHeaderCellDef>Port(s)</th>
            <td mat-cell *matCellDef="let element">{{ element['dst-port'] }}</td>
          </ng-container>
          <ng-container matColumnDef="bytes">
            <th mat-header-cell *matHeaderCellDef>Traffic</th>
            <td mat-cell *matCellDef="let element"><span [matTooltip]="element['bytes']">{{ element['bytes'] | humanReadableBytes }}</span></td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns; sticky: true"></tr>
          <tr mat-row *matRowDef="let row; columns: ['status','comment'];"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
      </div>
      <!--      </div>-->
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

    .table-icon.warn {
        color: #b71c1c;
    }

    tr.mat-mdc-row:nth-of-type(2n+1) {
      background-color: #f9f9f9; /* Alternate row background for better distinction */
    }

    tr.mat-mdc-row:nth-of-type(2n+1) td {
      border-bottom: none; /* Remove bottom border for first rows */
    }


  `]
})
export class FirewallsComponent implements OnChanges {
  displayedColumns = ['in', 'out', 'src','dst', 'protocol', 'dst-port', 'bytes'];
  dataSource: MatTableDataSource<any> = new MatTableDataSource();
  showAll: boolean = false;
  @Input() firewalls: any[]

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['firewalls']) {
      this.updateDataSource(changes['firewalls'].currentValue);
    }
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  updateDataSource(firewalls: any[]) {
    this.dataSource.data = firewalls;
    this.applyFilter();
  }

  applyFilter() {
    if (this.showAll) {
      this.dataSource.filterPredicate = (data: any, filter: string) => true;
    } else {
      this.dataSource.filterPredicate = (data: any, filter: string) => !(data.dynamic === 'true') && !(data.disabled === 'true');
    }
    this.dataSource.filter = 'enabled';
  }
}
