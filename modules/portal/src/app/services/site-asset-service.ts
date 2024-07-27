import {HttpClient, HttpHeaders, HttpResponse} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {Asset, Site} from '../models/model';
import {ToastService} from './toast-service';

@Injectable({
  providedIn: 'root'
})
export class SiteAssetService {

  private siteUrl = 'https://j8gvyebg6g.execute-api.ap-southeast-2.amazonaws.com/prod/manager/986922ea-0eb2-4ca4-ab88-904021866c3b/site';
  private toolUrl = 'https://j8gvyebg6g.execute-api.ap-southeast-2.amazonaws.com/prod/controller/986922ea-0eb2-4ca4-ab88-904021866c3b/site';

  constructor(private http: HttpClient, private toastService: ToastService) {
  }

  getSites(): Observable<Site[]> {
    return this.http.get<Site[]>(this.siteUrl);
  }

  getAssets(siteId: string): Observable<Asset[]> {
    const assetUrl = `${this.siteUrl}/${siteId}/asset`;
    return this.http.get<Asset[]>(assetUrl);
  }

  getAssetConfig(siteId: string, assetId: string): Observable<HttpResponse<string>> {
    const assetUrl = `${this.siteUrl}/${siteId}/assetconfig/${assetId}`;
    return this.http.get(assetUrl, {headers: new HttpHeaders({'Content-Type': 'text/plain', 'Accept': 'text/plain'}), observe: 'response', responseType: 'text'});
  }

  runAssetCommand(siteId: string, assetId: string, command: string): Observable<any> {
    const toolUrl = `${this.toolUrl}/${siteId}/asset/${assetId}/${command}`;
    return this.http.get(toolUrl);//.pipe(catchError(this.handleError.bind(this)));
  }

  getTrafficData(siteId: string, assetId: string, host: string, port: string, timeRange: string): Observable<any> {
    return this.http.post<any>(`${this.siteUrl}/${siteId}/assetchart/${assetId}`, {
      host: host,
      port: port,
      time_range: timeRange
    });
  }

  updateCertificate(siteId: string, assetId: string): Observable<any> {
    return this.http.put(`${this.toolUrl}/${siteId}/asset/${assetId}/csr`, {});
  }


  activateRouter(siteId: string, assetId: string): Observable<any> {
    return this.http.put(`${this.siteUrl}/${siteId}/activateasset/${assetId}`, {});
  }

  deactivateRouter(siteId: string, assetId: string): Observable<any> {
    return this.http.put(`${this.siteUrl}/${siteId}/deactivateasset/${assetId}`, {});
  }

  commissionRouter(siteId: string, assetId: string): Observable<any> {
    return this.http.post(`${this.siteUrl}/${siteId}/commission/${assetId}`, {});
  }

  // private handleError(error: HttpErrorResponse): Observable<never> {
  //   let errorMessage = 'An unknown error occurred!';
  //   if (error.error instanceof ErrorEvent) {
  //     // Client-side error
  //     errorMessage = `Error: ${error.error.message}`;
  //   } else {
  //     // Server-side error
  //     errorMessage = `${error.error.message}`;
  //   }
  //   this.toastService.showErrorAlert(errorMessage);
  //   return new Observable((observer) => {
  //     observer.error(errorMessage);
  //   });
  // }

}
