import {CommonModule} from '@angular/common';
import {Component, EventEmitter, inject, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {ChartComponent} from '../chart.component';
import {AddresssComponent} from '../mikrotik/address.component';
import {ArpsComponent} from '../mikrotik/arp.component';
import {FirewallsComponent} from '../mikrotik/firewall.component';
import {InterfacesComponent} from '../mikrotik/interface.component';
import {IPAddressesComponent} from '../mikrotik/ipaddress.component';
import {RoutetableComponent} from '../mikrotik/routetable.component';
import {Asset, InvoiceEvent, Rate, Site} from '../models/model';
import {AuthService} from '../services/auth-service';
import {SiteAssetService} from '../services/site-asset-service';
import {TileComponent} from '../tile.component';
import {InvoiceEventDialogComponent} from './invoice-event-component';

@Component({
  selector: 'app-live-tools',
  standalone: true,
  imports: [
    AddresssComponent,
    ArpsComponent,
    ChartComponent,
    FirewallsComponent,
    IPAddressesComponent,
    InterfacesComponent,
    RoutetableComponent,
    TileComponent, CommonModule
  ],
  template: `
    <div class="d-flex align-items-start v-tabs-panel">
      <div class="nav flex-column nav-pills" id="v-pills-tab" role="tablist" aria-orientation="vertical">
        <button class="nav-link active" id="v-pills-chart-tab" data-bs-toggle="pill" data-bs-target="#v-pills-chart" type="button role=tab" aria-controls="v-pills-radius" aria-selected="false">Chart</button>
        <button class="nav-link" id="v-pills-interface-tab" data-bs-toggle="pill" data-bs-target="#v-pills-interface" type="button role=tab" aria-controls="v-pills-interface" aria-selected="false" (click)="runCommand('interface')">Interfaces</button>
        <button class="nav-link" id="v-pills-route-tab" data-bs-toggle="pill" data-bs-target="#v-pills-route" type="button role=tab" aria-controls="v-pills-route" aria-selected="false" (click)="runCommand('route_table')">Route Table</button>
        <button class="nav-link" id="v-pills-arp-tab" data-bs-toggle="pill" data-bs-target="#v-pills-arp" type="button role=tab" aria-controls="v-pills-arp" aria-selected="false" (click)="runCommand('arp_table')">ARP Table</button>
        <button class="nav-link" id="v-pills-ipaddress-tab" data-bs-toggle="pill" data-bs-target="#v-pills-ipaddress" type="button role=tab" aria-controls="v-pills-ipaddress" aria-selected="false" (click)="runCommand('ip_address')">IP Addresses</button>
        <button class="nav-link" id="v-pills-firewall-tab" data-bs-toggle="pill" data-bs-target="#v-pills-firewall" type="button role=tab" aria-controls="v-pills-firewall" aria-selected="false" (click)="runCommand('ip_firewall')">Firewall Policy</button>
        <button class="nav-link" id="v-pills-addresses-tab" data-bs-toggle="pill" data-bs-target="#v-pills-addresses" type="button role=tab" aria-controls="v-pills-addresses" aria-selected="false" (click)="runCommand('ip_firewall_address')">Firewall Addresses</button>
        <button class="nav-link" id="v-pills-action-tab" data-bs-toggle="pill" data-bs-target="#v-pills-action" type="button role=tab" aria-controls="v-pills-action" aria-selected="true">Router Commands</button>
      </div>
      <div class="tab-content" id="v_pills-tabContent">
        <div class="tab-pane fade show active" id="v-pills-chart" role="tabpanel" aria-labelledby="v-pills-chart-tab">
          <app-chart [siteId]="site.id" [asset]="asset"></app-chart>
        </div>

        <div class="tab-pane fade" id="v-pills-route" role="tabpanel" aria-labelledby="v-pills-route-tab">
          @if (commandResponse.get('route_table')) {
            <app-routetable [routes]="commandResponse.get('route_table')"></app-routetable>
          }
        </div>

        <div class="tab-pane fade" id="v-pills-arp" role="tabpanel" aria-labelledby="v-pills-arp-tab">
          @if (commandResponse.get('arp_table')) {
            <app-arp-list [arps]="commandResponse.get('arp_table')"/>
          }
        </div>
        <div class="tab-pane fade" id="v-pills-interface" role="tabpanel" aria-labelledby="v-pills-interface-tab">
          @if (commandResponse.get('interface')) {
            <app-interface-list [interfaces]="commandResponse.get('interface')"/>
          }
        </div>

        <div class="tab-pane fade" id="v-pills-ipaddress" role="tabpanel" aria-labelledby="v-pills-ipaddress-tab">
          @if (commandResponse.get('ip_address')) {
            <app-ipaddress-list [ips]="commandResponse.get('ip_address')"/>
          }
        </div>
        <div class="tab-pane fade" id="v-pills-firewall" role="tabpanel" aria-labelledby="v-pills-firewall-tab">
          @if (commandResponse.get('ip_firewall')) {
            <app-firewall-list [firewalls]="commandResponse.get('ip_firewall')"/>
          }
        </div>

        <div class="tab-pane fade" id="v-pills-addresses" role="tabpanel" aria-labelledby="v-pills-addresses-tab">
          @if (commandResponse.get('ip_firewall_address')) {
            <app-address-list [addresses]="commandResponse.get('ip_firewall_address')"/>
          }
        </div>
        <div class="tab-pane fade" id="v-pills-action" role="tabpanel" aria-labelledby="v-pills-addresses-tab">
          <div class="tile-wrapper">
            @if (authService.isAdmin$ | async) {
              <app-tile buttonText="Update Certificate" [action]="updateCert"/>
              <app-tile buttonText="Make Router Active" *ngIf="!asset.active" [action]="openActivateInvoiceEventDialog"/>
              <app-tile buttonText="Make Router Inactive" *ngIf="asset.active" [action]="openDectivateInvoiceEventDialog"/>
              <app-tile buttonText="Commission" [action]="commission"/>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tab-content {
      flex: 1;
    }

    .nav-pills {
      height: 100%;
      background-color: rgba(239, 242, 246, 0.9);
      box-shadow: 5px 0 10px -5px rgba(0, 0, 0, 0.5);
      z-index: 1000;
    }

    .tab-content {
      height: 100%;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      padding-left: 8px;
    }

    .tab-content > div.active {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 8px 0;
    }

    .tab-content > .active {
      height: 100%;
      overflow-y: hidden;
    }

    .v-tabs-panel {
      height: 100%;
    }

    .tile-wrapper {
      display: flex;
      flex-wrap: wrap;
      gap: 0; /* Adjust the gap between tiles */
    }

  `]
})
export class LiveToolsComponent implements OnChanges, OnInit {
  private siteAssetService: SiteAssetService = inject(SiteAssetService);
  @Input({required: true}) site: Site;
  @Input({required: true}) asset: Asset
  @Output() activeChange = new EventEmitter<boolean>();
  commandResponse: Map<string, any | null> = new Map();
  authService: AuthService = inject(AuthService);
  dialog: MatDialog = inject(MatDialog);
  service: SiteAssetService = inject(SiteAssetService);

  rates: Rate[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['asset']) {
      this.commandResponse.clear();
    }
  }

  ngOnInit(): void {
    // Load rates when the component is initialized
    this.service.getRates().subscribe(rates => {
      this.rates = rates;
    });
  }

  runCommand(command: string) {
    this.siteAssetService.runAssetCommand(this.site?.id ?? '', this.asset?.id ?? '', command).subscribe(response => {
      if (response.data)
        this.commandResponse.set(command, response.data);
    });
  }

  activateRouter = (invoiceEvent: InvoiceEvent) => {
    this.siteAssetService.activateRouter(this.site.id, this.asset.id, invoiceEvent).subscribe(response => {
      // if (response.data) {
      this.asset.active = true;
      this.site.active = true;
      this.activeChange.emit(true);
      // }
    });
  }

  deactivateRouter = (invoiceEvent: InvoiceEvent) => {
    this.siteAssetService.deactivateRouter(this.site.id, this.asset.id, invoiceEvent).subscribe(response => {
      // if (response.data) {
      this.asset.active = false;
      this.site.active = false;
      this.activeChange.emit(false);
      // }
    });
  }

  commission = () => {
    this.siteAssetService.commissionRouter(this.site.id, this.asset.id).subscribe(response => {
      this.asset.active = false;
      this.site.active = false;
      this.activeChange.emit(false);
      // }
    });
  }

  updateCert = () => {
    this.siteAssetService.updateCertificate(this.site.id, this.asset.id).subscribe(response => {
    });
  }

  openActivateInvoiceEventDialog = () => {
    const dialogRef = this.dialog.open(InvoiceEventDialogComponent, {
      width: '400px',
      data: {siteId: this.site.id, assetId: this.asset.id, activate: true, rates: this.rates}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.asset.active = true;
        this.site.active = true;
        this.activeChange.emit(true);
      }
    });
  }
  openDectivateInvoiceEventDialog = () => {
    const dialogRef = this.dialog.open(InvoiceEventDialogComponent, {
      width: '400px',
      data: {siteId: this.site.id, assetId: this.asset.id, activate: false, rates: this.rates}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.asset.active = false;
        this.site.active = false;
        this.activeChange.emit(false);
      }
    });
  }

}
