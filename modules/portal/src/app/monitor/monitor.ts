import {CommonModule} from '@angular/common';
import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {MatButtonModule, MatIconButton} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {ActivatedRoute} from '@angular/router';
import {Subscription} from 'rxjs';
import {Glance, GlanceAsset} from '../models/model';
import {SiteAssetService} from '../services/site-asset-service';
import {WebSocketService} from '../services/WebSocketService';
import {TimeAgoComponent} from '../view/time-ago.component';

@Component({
  selector: 'app-monitor',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule, TimeAgoComponent, MatButtonModule],
  providers: [WebSocketService],
  template: `
    <div class="header">
      <img src="assets/images/BlackSaltIT_Red_Stacked_TransparentBG.png" alt="Black Salt IT Logo" class="logo"/>
      <!--      <h1 class="mat-headline-medium">Device Status</h1>-->
      <div>
        @if (lastRun) {
          <app-time-ago [dateTime]="lastRun"/>
        }
      </div>
      <!--      <div>-->
      <!--        @if (lastUpdate) {-->
      <!--          <app-time-ago [dateTime]="lastUpdate"/>-->
      <!--        }-->
      <!--      </div>-->
      <div class="status">
        @switch (status) {
          @case ('Connected') {
            <mat-icon fontSet="fa" fontIcon="fa-plug-circle-bolt" class="fa-duotone" style="color: rgba(28, 100, 28, 1); "></mat-icon>
          }
          @case ('Disconnected') {
            <mat-icon fontSet="fa" fontIcon="fa-plug-circle-xmark" class="fa-duotone" style="color: rgba(100, 28, 28, 1); "></mat-icon>
          }
          @case ('Error') {
            <mat-icon fontSet="fa" fontIcon="fa-plug-circle-exclamation" class="fa-duotone" style="color: rgba(100, 28, 28, 1); "></mat-icon>
          }
        }
      </div>

    </div>
    <div class="devices">

      @for (asset of monitor?.assets; let i = $index; track asset.hostname) {
        @if (i > 0 && monitor && asset.status! !== monitor.assets[i - 1].status!) {
          <div class="break"></div>
        }
        @if (asset.status === 0) {
          <div class="router outage" [tabindex]="i">
            <div class="router-icon">
              <mat-icon fontSet="fa" fontIcon="fa-seal-exclamation" class="fa-regular"></mat-icon>
            </div>
            <div class="site">
              <span class="mat-label-small" [matTooltip]="asset.name">{{ asset.name }}</span>
            </div>
          </div>
        } @else if (asset.status === 1) {
          <div class="router" [tabindex]="i">
            <div class="int-wrap">
              @for (intfce of asset.interfaces; track intfce) {
                <div class="int-icon">
                  @if (intfce.name === "lte") {
                    @if (intfce.running) {
                      <mat-icon matTooltip="4G" [color]="intfce.running ?  'primary': 'warn'" [ngClass]="{'active-int': intfce.running}">wifi</mat-icon>
                    } @else {
                      <button mat-icon-button (click)="resetUSB(asset.hostname)">
                        <mat-icon [color]="intfce.running ?  'primary': 'warn'">wifi</mat-icon>
                      </button>
                    }
                  } @else {
                    <mat-icon fontSet="fa" fontIcon="fa-ethernet" class="fa-duotone" matTooltip="NBN" [color]="intfce.running ?  'primary': 'warn'" [ngClass]="{'active-int': intfce.running}"></mat-icon>
                  }
                  <!--                  <div class="mat-label-small int">{{ intfce.name }}</div>-->
                </div>
              }
            </div>
            <div class="site">
              <span class="mat-label-small" [matTooltip]="asset.name">{{ asset.name }}</span>
            </div>
          </div>
        } @else {
          <div class="router active" [tabindex]="i">
            <div class="router-icon">
              <mat-icon fontSet="fa" fontIcon="fa-wave-pulse" class="fa-duotone fa-thin fa-active"></mat-icon>
            </div>
            <div class="site">
              <span class="mat-label-small" [matTooltip]="asset.name">{{ asset.name }}</span>
            </div>
          </div>
        }
      }
    </div>
    <!--    <pre>{{ monitor | json }}</pre>-->
  `,
  styles: [`
    :host {
      display: flex;
      width: 100vw;
      flex-direction: column;
      align-items: center;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100vw;
      max-width: 800px;
    }

    .header .status {
      width: 137.53px;
      margin: 8px 12px;
      display: flex;
      justify-content: end;
      align-items: center;
    }

    .header .status mat-icon {
      font-size: 24px;
      width: 30px;
      height: 30px;
    }

    .devices {
      display: flex;
      align-items: flex-end;
      justify-content: center;
      gap: 10px;
      flex-wrap: wrap;
      width: 100vw;
      max-width: 800px;
      padding-bottom: 80px;
    }

    .devices .router {
      margin: 4px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      border: 1px solid rgba(218, 165, 32, 0.5);
      background-color: rgba(218, 165, 32, 0.15);
      border-radius: 4px;
      position: relative;
      overflow: hidden;
      transition: background-color 3s ease;
    }

    .devices .router.outage {
      border-color: rgba(183, 28, 28, 0.5);
      background-color: rgba(183, 28, 28, 0.15);
    }

    .devices .router.active {
      border-color: rgba(28, 183, 28, 0.5);
      background-color: rgba(28, 183, 28, 0.15);
    }

    .devices .router::before {
      content: "";
      top: -24px;
      left: -24px;
      position: absolute;
      background-color: rgba(218, 165, 32, 0.5);
      border: 1px solid rgba(218, 165, 32, 0.5);;
      border-radius: 50%;
      width: 48px;
      height: 48px;
    }

    .devices .router.active::before {
      top: -12px;
      left: -12px;
      width: 24px;
      height: 24px;
    }

    .devices .router:focus {
      flex-basis: 220px;
      background-color: rgba(218, 165, 32, 0.5);
      /*width: 200px;*/
    }

    .devices .router.active:focus {
      flex-basis: 192px;
      background-color: rgba(28, 183, 28, .5);
      /*width: 200px;*/
    }

    .devices .router:focus .site {
      /*width: 200px;*/
      width: 100%;
      max-width: 100vw;
    }


    .devices .router.outage::before {
      border-color: rgba(183, 28, 28, 0.5);
      background-color: rgba(183, 28, 28, 0.5);
    }

    .devices .router.active::before {
      border-color: rgba(28, 183, 28, 0.5);
      background-color: rgba(28, 183, 28, 0.5);
    }

    .devices .router.active > div:first-child {
      padding: 10px 10px 4px 10px;
    }

    .devices .router.active .router-icon mat-icon {
      color: rgba(28, 100, 28, 1);
      /*color: #666;*/
    }

    .devices .router.outage .router-icon mat-icon {
      color: rgba(100, 28, 28, 1);
    }

    .devices .router > div:first-child {
      /*padding: 10px 10px 4px 10px;*/
      display: flex;
      gap: 0;
    }

    .devices .router > div {
      padding: 2px;
    }

    .active-int {
      color: rgba(28, 183, 28, 0.75);
    }

    .site {
      background-color: rgba(218, 165, 32, 0.5);
    }

    .active .site {
      padding: 0 2px !important;
      background-color: rgba(28, 128, 28, .5);
    }

    .site, .int {
      width: 116px;
      max-width: 116px;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      text-align: center;
    }

    .active .site, .int {
      width: 50px;
      max-width: 50px;
    }

    .int {
      width: 36px;
      max-width: 36px;
    }

    .int-wrap {
      display: flex;

    }

    .int-icon {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 48px;
      height: 48px;
    }

    .router-icon mat-icon, .int-icon mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden
    }

    .active .router-icon mat-icon {
      font-size: 22px;
      width: 26px;
      height: 26px;
    }

    .break {
      flex-basis: 100%;
      height: 0;
    }

  `]
})
export class MonitorComponent implements OnInit, OnDestroy {
  service: SiteAssetService = inject(SiteAssetService);
  monitor: Glance | null;
  lastRun: string | null;
  lastUpdate: string | null;
  private route: ActivatedRoute = inject(ActivatedRoute);
  private webSocketService: WebSocketService = inject(WebSocketService);
  private siteAssetService: SiteAssetService = inject(SiteAssetService);
  private _subs: Subscription[] = [];
  status: string = 'Disconnected';

  private hash: string | null = '';

  constructor() {
  }

  ngOnInit() {
    setTimeout(() => {
      this.getData();
    });


    this.route.paramMap.subscribe(params => {
      const tenantId = params.get('tenantId');
      if (tenantId) {
        this.webSocketService.url = `wss://monitorws.blacksaltit.com.au/?tenantId=${tenantId}`;
        // this.webSocketService.url = `wss://upoeryyww0.execute-api.ap-southeast-2.amazonaws.com/production/?tenantId=${tenantId}`;
        this.webSocketService.connect().subscribe({
          next: (result) => {
            if (result) {
              console.log('WebSocket connection initiated successfully');
            } else {
              console.log('WebSocket connection failed');
            }
          },
          error: (error) => {
            console.error('Error during WebSocket connection:', error);
          },
          complete: () => {
            console.log('WebSocket connection handling complete');
          }
        });
        this._subs.push(this.webSocketService.status.subscribe({
          next: (status) => {
            this.status = status;
          }
        }))
      }
    });

    this._subs.push(this.webSocketService._hash$.obs$.subscribe({
      next: (data) => {
        if(data !== this.hash){
          this.getData();
        }
        this.hash = data;

      }
    }));
    this._subs.push(this.webSocketService._lastRun$.obs$.subscribe({
      next: (data) => {
        this.lastRun = data;
      }
    }));
    this._subs.push(this.webSocketService._lastUpdate$.obs$.subscribe({
      next: (data) => {
        this.lastUpdate = data;
      }
    }));
  }

  ngOnDestroy() {
    this.webSocketService.closeWebSocket();
    this._subs.forEach((sub: Subscription) => {
      sub.unsubscribe();
    });
  }

  getData(){
    this.service.getGlance().subscribe((data) => {
      console.log(data);
      this.monitor = data.glance;
      this.hash = data.hash;
      this.lastRun = data.lastRun;
      this.lastUpdate = data.lastUpdate;
      this.monitor.assets.sort(this.sortAssets);
    });
  }

  sortAssets(a: GlanceAsset, b: GlanceAsset): number {
    if (a.status !== b.status)
      return a.status - b.status;
    if (a.name !== b.name)
      return a.name.localeCompare(b.name);
    return a.hostname.localeCompare(b.hostname);
  }

  resetUSB = (hostname: string) => {
    this.siteAssetService.resetUSBByHost(hostname).subscribe(response => {});
  }
}
