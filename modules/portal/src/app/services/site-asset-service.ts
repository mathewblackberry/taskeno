// src/app/services/site-asset.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Site, Asset } from '../models/model';

@Injectable({
  providedIn: 'root'
})
export class SiteAssetService {

  private siteUrl = 'https://j8gvyebg6g.execute-api.ap-southeast-2.amazonaws.com/prod/manager/986922ea-0eb2-4ca4-ab88-904021866c3b/site';

  constructor(private http: HttpClient) { }

  getSites(): Observable<Site[]> {
    return this.http.get<Site[]>(this.siteUrl);
  }

  getAssets(siteId: string): Observable<Asset[]> {
    const assetUrl = `${this.siteUrl}/${siteId}/asset`;
    return this.http.get<Asset[]>(assetUrl);
  }
}
