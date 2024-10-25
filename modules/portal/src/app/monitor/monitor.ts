import {CommonModule} from '@angular/common';
import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {ActivatedRoute} from '@angular/router';
import {Subscription} from 'rxjs';
import {Glance, GlanceAsset} from '../models/model';
import {SiteAssetService} from '../services/site-asset-service';
import {WebSocketService} from '../services/WebSocketService';

@Component({
  selector: 'app-monitor',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  providers: [WebSocketService],
  template: `
    <h1 class="mat-headline-medium">Device Status</h1>
    <div class="devices">

      @for (asset of monitor?.assets; track asset.hostname) {
        @if (asset.status === 0) {
          <div class="router outage">
            <div class="router-icon">
              <mat-icon fontSet="fa" fontIcon="fa-face-anguished" class="fa-regular"></mat-icon>
            </div>
            <div class="site">
              <span class="mat-label-small" [matTooltip]="asset.name">{{ asset.name }}</span>
            </div>
          </div>
        } @else if (asset.status === 1) {
          <div class="router">
            <div>
              @for (intfce of asset.interfaces; track intfce) {
                <div class="int-icon">
                  @if (intfce.name === "lte") {
                    <mat-icon fontSet="fa" fontIcon="fa-wifi" class="fa-light" [matTooltip]="asset.name" [color]="intfce.running ?  'primary': 'warn'" [ngClass]="{'active-int': intfce.running}"></mat-icon>
                  } @else {
                    <mat-icon fontSet="fa" fontIcon="fa-ethernet" class="fa-light" [matTooltip]="asset.name" [color]="intfce.running ?  'primary': 'warn'" [ngClass]="{'active-int': intfce.running}"></mat-icon>
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
          <div class="router active">
            <div class="router-icon">
              <mat-icon fontSet="fa" fontIcon="fa-face-smile" class="fa-regular fa-active"></mat-icon>
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
    .devices {
      display: flex;
      align-items: flex-end;
      justify-content: center;
      gap: 10px;
      flex-wrap: wrap;
      width: 100vw
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
      overflow: hidden
    }

    .devices .router.outage {
      border-color: rgba(183, 28, 28, 0.5);
      background-color: rgba(183, 28, 28, 0.15);
    }

    .devices .router.active {
      border-color: rgba(28,183, 28, 0.5);
      background-color: rgba(28,183, 28, 0.15);
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

    .devices .router.outage::before {
      border-color: rgba(183, 28, 28, 0.5);
      background-color: rgba(183, 28, 28, 0.5);
    }

    .devices .router.active::before {
      border-color: rgba(28, 183, 28, 0.5);
      background-color: rgba(28, 183, 28, 0.5);
    }

    .devices .router > div:first-child {
      padding: 24px 24px 4px 24px;
      display: flex;
      gap: 8px;
    }

    .devices .router > div {
      padding: 2px;
    }

    .active-int {
      color: rgba(28, 183, 28, 0.75);
    }

    .site, .int {
      width: 100px;
      max-width: 100px;
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

    .router-icon mat-icon, .int-icon mat-icon {
      font-size: 30px;
      width: 36px;
      height: 36px;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden
    }

    .active .router-icon mat-icon {
      font-size: 24px;
      width: 26px;
      height: 26px;
    }


  `]
})
export class MonitorComponent implements OnInit, OnDestroy {
  service: SiteAssetService = inject(SiteAssetService);
  monitor: Glance | null;
  private route: ActivatedRoute = inject(ActivatedRoute);
  private webSocketService: WebSocketService = inject(WebSocketService);
  private _subs: Subscription[] = [];

  private hash: string = '';

  constructor() {
  }

  ngOnInit() {
    setTimeout(() => {
      this.getData();
    });

    this.route.paramMap.subscribe(params => {
      const tenantId = params.get('tenantId');
      console.log(this.route);
      if (tenantId) {
        this.webSocketService.url = `wss://upoeryyww0.execute-api.ap-southeast-2.amazonaws.com/production/?tenantId=${tenantId}`;
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
}
