// src/app/site-list/site-list.component.ts
import {CommonModule} from '@angular/common';
import { Component, OnInit } from '@angular/core';
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


@Component({
  selector: 'app-site-list',
  template: `
    <!-- src/app/site-list/site-list.component.html -->
    <div class="site-list">
<!--      <button mat-fab><mat-icon>add</mat-icon></button>-->
      <mat-form-field class="example-full-width" appearance="outline" style="width: 100%">
        <input type="text" matInput [formControl]="siteControl" [matAutocomplete]="auto" placeholder="Search Sites">
        <mat-autocomplete #auto="matAutocomplete" (optionSelected)="onSelectSite($event.option.value)" [displayWith]="displaySite">
          <mat-option *ngFor="let site of filteredSites | async" [value]="site">
            {{ site.name }}
          </mat-option>
        </mat-autocomplete>
      </mat-form-field>

      <div *ngIf="selectedSite">
        <h3>Assets for {{ selectedSite.name }}</h3>
        <mat-list>
          <mat-list-item *ngFor="let asset of assets" (click)="onSelectAsset(asset)">
            {{ asset.hostname }}
          </mat-list-item>
        </mat-list>
      </div>
      <mat-card *ngIf="selectedAsset">

        <mat-card-header>
          <h3>Details for {{ selectedAsset.hostname }}</h3>
        </mat-card-header>
        <mat-card-content>
          <mat-tab-group>
            <mat-tab label="General">
              <div>
                <p><strong>ID:</strong> {{ selectedAsset.id }}</p>
                <p><strong>Host Name:</strong> {{ selectedAsset.hostname }}</p>
                <p><strong>Terminals:</strong> {{ selectedAsset.terminals }}</p>
                <!-- Add other general fields here -->
              </div>
            </mat-tab>
            <mat-tab label="LAN Subnets" *ngIf="selectedAsset.lanSubnets">
              <div *ngFor="let subnet of selectedAsset.lanSubnets">
                <h4>Subnet: {{ subnet.subnet }}</h4>
                <div *ngFor="let host of subnet.hosts">
                  <p><strong>Host IP:</strong> {{ host.ip }}</p>
                  <p><strong>Name:</strong> {{ host.name }}</p>
                  <p><strong>Active:</strong> {{ host.active }}</p>
                  <p><strong>Default Gateway:</strong> {{ host.defaultGateway }}</p>
                  <p><strong>Network:</strong> {{ host.network }}</p>
                  <p><strong>Broadcast:</strong> {{ host.broadcast }}</p>
                </div>
              </div>
            </mat-tab>
            <mat-tab label="Router Details" *ngIf="selectedAsset.routerDetails">
              <div>
                <p><strong>Username:</strong> {{ selectedAsset.routerDetails.username }}</p>
                <p><strong>Password:</strong> {{ selectedAsset.routerDetails.password }}</p>
                <p><strong>Manufacturer:</strong> {{ selectedAsset.routerDetails.manufacturer }}</p>
                <p><strong>Model:</strong> {{ selectedAsset.routerDetails.model }}</p>
                <p><strong>Serial Number:</strong> {{ selectedAsset.routerDetails.serialNumber }}</p>
                <p><strong>Default Password:</strong> {{ selectedAsset.routerDetails.defaultPassword }}</p>
                <!-- Add other router details fields here -->
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
                <!-- Add other mobile details fields here -->
              </div>
            </mat-tab>
          </mat-tab-group>
        </mat-card-content>
      </mat-card>
    </div>


  `,
  styles: [``],
  imports: [
    MatListModule, CommonModule, MatTabsModule, MatInputModule, MatAutocompleteModule, ReactiveFormsModule, MatCardModule, MatButtonModule, MatIconModule
  ],
  standalone: true
})
export class SiteListComponent implements OnInit {
  siteControl = new FormControl();
  sites: Site[] = [];
  filteredSites: Observable<Site[]>;
  selectedSite: Site | null = null;
  assets: Asset[] = [];
  selectedAsset: Asset | null = null;

  constructor(private siteAssetService: SiteAssetService) {
    this.filteredSites = this.siteControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterSites(value))
    );
  }

  ngOnInit(): void {
    this.siteAssetService.getSites().subscribe(sites => {
      this.sites = sites;
      this.filteredSites = this.siteControl.valueChanges.pipe(
        startWith(''),
        map(value => typeof value === 'string' ? value : value?.name),
        map(name => name ? this._filterSites(name) : this.sites.slice())
      );
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

  displaySite(site: Site): string {
    return site && site.name ? site.name : '';
  }
}
