// src/app/site-list/site-list.component.ts
import {CommonModule} from '@angular/common';
import {Component, OnInit} from '@angular/core';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatButtonModule} from '@angular/material/button';
import {MatCard, MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatListModule} from '@angular/material/list';
import {MatTabsModule} from '@angular/material/tabs';
import {Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import {Asset, Site} from './models/model';
import {SiteAssetService} from './services/site-asset-service';
import {MatTableModule} from "@angular/material/table";
import {MatExpansionModule} from "@angular/material/expansion";


@Component({
  selector: 'app-site-list',
  template: `
    <!-- src/app/site-list/site-list.component.html -->
    <div class="site-list">
      <!--      <button mat-fab><mat-icon>add</mat-icon></button>-->
      <mat-form-field class="example-full-width" appearance="outline" style="width: 100%">
        <input type="text" matInput [formControl]="siteControl" [matAutocomplete]="auto" placeholder="Search Sites"
               [attr.autocomplete]="'off'"
               [attr.autocorrect]="'off'"
               [attr.autocapitalize]="'off'"
               spellcheck="false" data-lpignore="true">
        <mat-autocomplete #auto="matAutocomplete" (optionSelected)="onSelectSite($event.option.value)" [displayWith]="displaySite">
          <mat-option *ngFor="let site of filteredSites | async" [value]="site">
            {{ site.name }}
          </mat-option>
        </mat-autocomplete>
      </mat-form-field>

      <mat-accordion class="headers-align" multi>
        @for (asset of assets; track asset; let i = $index) {
          <mat-expansion-panel (afterExpand)="onSelectAsset(asset)" [expanded]="isFirstPanel(i,asset)">
            <mat-expansion-panel-header>
              <mat-panel-title>
                {{ asset.hostname }}
              </mat-panel-title>
              <mat-panel-description>
                {{ asset.loopbacks[0] }}
                <mat-icon>router</mat-icon>
              </mat-panel-description>
            </mat-expansion-panel-header>
            @if (selectedAsset) {
              <mat-tab-group>
                <mat-tab label="General">
                  <div>
                    <p><strong>ID:</strong> {{ selectedAsset.id }}</p>
                    <p><strong>Host Name:</strong> {{ selectedAsset.hostname }}</p>
                    <p><strong>Terminals:</strong> {{ selectedAsset.terminals }}</p>
                  </div>
                </mat-tab>
                <mat-tab label="LAN Subnets" *ngIf="selectedAsset.lanSubnets">
                  <mat-accordion class="headers-align" multi>
                    @for (subnet of selectedAsset.lanSubnets; track subnet; let first = $first) {
                      <mat-expansion-panel (afterExpand)="onSelectAsset(asset)" [expanded]="$first">
                        <mat-expansion-panel-header>
                          <mat-panel-title>
                            {{ subnet.subnet }}
                          </mat-panel-title>
                          <mat-panel-description>
                            &nbsp;
                            <mat-icon>menu_book</mat-icon>
                          </mat-panel-description>
                        </mat-expansion-panel-header>
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
                      </mat-expansion-panel>
                    }
                  </mat-accordion>

                </mat-tab>
                <mat-tab label="Router Details" *ngIf="selectedAsset.routerDetails">
                  <div>
                    <p><strong>Username:</strong> {{ selectedAsset.routerDetails.username }}</p>
                    <p><strong>Password:</strong> <span class="password">{{ selectedAsset.routerDetails.password }}</span></p>
                    <p><strong>Manufacturer:</strong> {{ selectedAsset.routerDetails.manufacturer }}</p>
                    <p><strong>Model:</strong> {{ selectedAsset.routerDetails.model }}</p>
                    <p><strong>Serial Number:</strong> {{ selectedAsset.routerDetails.serialNumber }}</p>
                    <p><strong>Default Password:</strong> <span class="password">{{ selectedAsset.routerDetails.defaultPassword }}</span></p>
                  </div>
                </mat-tab>
                <mat-tab label="Mobile Details" *ngIf="selectedAsset.routerDetails?.mobileDetails">
                  <div>
                    <p><strong>Username:</strong> {{ selectedAsset.routerDetails?.mobileDetails?.username }}</p>
                    <p><strong>Password:</strong> {{ selectedAsset.routerDetails?.mobileDetails?.password }}</p>
                    <p><strong>First Name:</strong> {{ selectedAsset.routerDetails?.mobileDetails?.firstName }}</p>
                    <p><strong>Last Name:</strong> {{ selectedAsset.routerDetails?.mobileDetails?.lastName }}</p>
                    <p><strong>SIM Serial:</strong> {{ selectedAsset.routerDetails?.mobileDetails?.simSerial }}</p>
                    <p><strong>Mobile Number:</strong> {{ selectedAsset.routerDetails?.mobileDetails?.mobileNumber }}</p>
                    <p><strong>PUK:</strong> {{ selectedAsset.routerDetails?.mobileDetails?.PUK }}</p>
                  </div>
                </mat-tab>
              </mat-tab-group>
            }
          </mat-expansion-panel>
        }
      </mat-accordion>
    </div>


  `,
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

    .password {
      font-family: "Fira Code Light","Fira Code", monospace;
      font-size: 120%;
    }
    .headers-align .mat-expansion-panel-header-description {
      justify-content: space-between;
      align-items: center;
    }

    .headers-align .mat-mdc-form-field + .mat-mdc-form-field {
      margin-left: 8px;
    }
  `],
  imports: [MatListModule, CommonModule, MatTabsModule, MatInputModule, MatAutocompleteModule, ReactiveFormsModule, MatCardModule, MatButtonModule, MatIconModule, MatTableModule, MatExpansionModule],
  standalone: true
})
export class SiteListComponent implements OnInit {
  siteControl = new FormControl();
  sites: Site[] = [];
  filteredSites: Observable<Site[]>;
  selectedSite: Site | null = null;
  assets: Asset[] = [];
  selectedAsset: Asset | null = null;
  displayedColumns: string[] = ['ip', 'name', 'active'];

  constructor(private siteAssetService: SiteAssetService) {
    this.filteredSites = this.siteControl.valueChanges.pipe(startWith(''), map(value => this._filterSites(value)));
  }

  ngOnInit(): void {
    this.siteAssetService.getSites().subscribe(sites => {
      this.sites = sites;
      this.filteredSites = this.siteControl.valueChanges.pipe(startWith(''), map(value => typeof value === 'string' ? value : value?.name), map(name => name ? this._filterSites(name) : this.sites.slice()));
    });
  }

  private _filterSites(value: string): Site[] {
    const filterValue = value.toLowerCase();
    return this.sites.filter(site => site.name?.toLowerCase().includes(filterValue));
  }

  onSelectSite(site: Site): void {
    this.selectedSite = site;
    this.siteAssetService.getAssets(site.id).subscribe(assets => {
      this.assets = assets;
      this.selectedAsset = null; // Reset selected asset when a new site is selected
    });
  }

  onSelectAsset(asset: Asset): void {
    this.selectedAsset = asset;
  }

  isFirstPanel(index: number, asset: Asset): boolean {
    if(index === 0){
      this.onSelectAsset(asset);
    }
    return index === 0;
  }

  displaySite(site: Site): string {
    return site && site.name ? site.name : '';
  }
}
