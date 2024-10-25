import { Routes } from '@angular/router';
import {MonitorComponent} from './monitor/monitor';
import {SiteListComponent} from './site-list.component';

export const routes: Routes = [
  {path: 'site', component: SiteListComponent},
  {path: 'monitor/:tenantId', component: MonitorComponent},
];
