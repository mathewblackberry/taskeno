import {CommonModule} from '@angular/common';
import {Component, Input} from '@angular/core';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatIconModule} from '@angular/material/icon';
import {MatTableModule} from '@angular/material/table';
import {Asset} from '../models/model';

@Component({
  selector: 'app-lan-subnets',
  standalone: true,
  imports: [
    MatTableModule, MatExpansionModule, MatIconModule, CommonModule
  ],
  template: `
    @if (selectedAsset.lanSubnets.length > 1) {
      <mat-accordion class="headers-align" multi>
        @for (subnet of selectedAsset.lanSubnets; track subnet; let first = $first) {
          <mat-expansion-panel [expanded]="first">
            <mat-expansion-panel-header>
              <mat-panel-title>
                {{ subnet.subnet }}
              </mat-panel-title>
              <mat-panel-description>
                &nbsp;
                <mat-icon>menu_book</mat-icon>
              </mat-panel-description>
            </mat-expansion-panel-header>
            <ng-container *ngTemplateOutlet="assetTable; context: { data: (selectedAsset.lanSubnets[0]) }"/>
          </mat-expansion-panel>
        }
        <div></div>
      </mat-accordion>
    } @else if (selectedAsset.lanSubnets.length === 1) {
      <div class="center-align mat-title-medium">{{ selectedAsset.lanSubnets[0].subnet }}</div>
      <ng-container *ngTemplateOutlet="assetTable; context: { data: (selectedAsset.lanSubnets[0]) }"/>
    }

    <ng-template #assetTable let-subnet=data>
      <table mat-table [dataSource]="subnet.hosts" class="mat-table">
        <ng-container matColumnDef="ip" class="ip-column">
          <th mat-header-cell *matHeaderCellDef class="ip-column"> IP</th>
          <td mat-cell *matCellDef="let element"> {{ element.ip }}</td>
        </ng-container>
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef> Name</th>
          <td mat-cell *matCellDef="let element"> {{ element.name }}</td>
        </ng-container>
        <ng-container matColumnDef="active">
          <th mat-header-cell *matHeaderCellDef class="active-column"> Active</th>
          <td mat-cell *matCellDef="let element" class="active-column">
            @if (element.active) {
              <mat-icon>check</mat-icon>
            } @else {
              <mat-icon>close</mat-icon>
            }</td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;" [ngClass]="{'network-row': row.network || row.broadcast}"></tr>
      </table>
    </ng-template>
  `,
  styleUrl: './view.scss',
  styles: [`
    .active-column {
      width: 60px;
      text-align: center;
    }

    .ip-column {
      width: 200px;
    }

    .network-row {
      font-weight: bold;
      background-color: #f0f0f0;
    }

    .headers-align .mat-expansion-panel-header-description {
      justify-content: space-between;
      align-items: center;
    }

    .headers-align .mat-mdc-form-field + .mat-mdc-form-field {
      margin-left: 8px;
    }

    .center-align {
      display: flex;
      justify-content: center;
      padding: 5px 16px;
    }
  `]
})
export class LanSubnetsComponent {
  @Input() displayedColumns: string[] = ['ip', 'name', 'active'];
  @Input({required:true}) selectedAsset: Asset
}
