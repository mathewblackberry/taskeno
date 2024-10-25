import {HttpClient, HttpHeaders, HttpResponse} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {Asset, Comment, Glance, InvoiceEvent, Rate, Site} from '../models/model';
import {ToastService} from './toast-service';

@Injectable({
  providedIn: 'root'
})
export class SiteAssetService {

  private portalUrl = 'https://j8gvyebg6g.execute-api.ap-southeast-2.amazonaws.com/prod/manager/986922ea-0eb2-4ca4-ab88-904021866c3b';
  private toolUrl = 'https://j8gvyebg6g.execute-api.ap-southeast-2.amazonaws.com/prod/controller/986922ea-0eb2-4ca4-ab88-904021866c3b/site';

  constructor(private http: HttpClient, private toastService: ToastService) {
  }

  getSites(): Observable<Site[]> {
    return this.http.get<Site[]>(`${this.portalUrl}/site`);
  }

  updateSite(site: Site): Observable<Site[]> {
    const siteUrl = `${this.portalUrl}/site/${site.id}`;
    return this.http.put<Site[]>(siteUrl, site);
  }

  getAssets(siteId: string): Observable<Asset[]> {
    const assetUrl = `${this.portalUrl}/site/${siteId}/asset`;
    return this.http.get<Asset[]>(assetUrl);
  }

  getRates(): Observable<Rate[]> {
    return this.http.get<Rate[]>(`${this.portalUrl}/rate`);
  }

  updateRate(rate: Rate): Observable<Rate[]>{
    return this.http.put<Rate[]>(`${this.portalUrl}/rate/${rate.id}`, rate);
  }

  addRate(rate: Rate): Observable<Rate[]>{
    return this.http.post<Rate[]>(`${this.portalUrl}/rate`, rate);
  }




  updateAsset(siteId: string, assetId: string, asset: Asset): Observable<Asset[]> {
    const assetUrl = `${this.portalUrl}/site/${siteId}/asset/${assetId}`;
    return this.http.put<Asset[]>(assetUrl, asset);
  }

  getAssetConfig(siteId: string, assetId: string): Observable<HttpResponse<string>> {
    const assetUrl = `${this.portalUrl}/site/${siteId}/assetconfig/${assetId}`;
    return this.http.get(assetUrl, {headers: new HttpHeaders({'Content-Type': 'text/plain', 'Accept': 'text/plain'}), observe: 'response', responseType: 'text'});
  }

  runAssetCommand(siteId: string, assetId: string, command: string): Observable<any> {
    const toolUrl = `${this.toolUrl}/${siteId}/asset/${assetId}/${command}`;
    return this.http.get(toolUrl);//.pipe(catchError(this.handleError.bind(this)));
  }

  getTrafficData(siteId: string, assetId: string, host: string, port: string, timeRange: string): Observable<any> {
    return this.http.post<any>(`${this.portalUrl}/site/${siteId}/assetchart/${assetId}`, {
      host: host,
      port: port,
      time_range: timeRange
    });
  }

  updateCertificate(siteId: string, assetId: string): Observable<any> {
    return this.http.put(`${this.toolUrl}/${siteId}/asset/${assetId}/csr`, {});
  }


  activateRouter(siteId: string, assetId: string, invoiceEvent: InvoiceEvent): Observable<any> {
    return this.http.put(`${this.portalUrl}/site/${siteId}/activateasset/${assetId}`, invoiceEvent);
  }

  deactivateRouter(siteId: string, assetId: string, invoiceEvent: InvoiceEvent): Observable<any> {
    return this.http.put(`${this.portalUrl}/site/${siteId}/deactivateasset/${assetId}`, invoiceEvent);
  }

  commissionRouter(siteId: string, assetId: string): Observable<any> {
    return this.http.post(`${this.portalUrl}/site/${siteId}/commission/${assetId}`, {});
  }

  commissionRouterCreds(siteId: string, assetId: string): Observable<any> {
    return this.http.post(`${this.portalUrl}/site/${siteId}/commissioncred/${assetId}`, {});
  }

  updateRouterSNMP(siteId: string, assetId: string): Observable<any> {
    return this.http.get(`${this.portalUrl}/site/${siteId}/snmpupdate/${assetId}`, {});
  }


  getComments(assetId: string): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.portalUrl}/asset/${assetId}/comment`);
  }

  getComment(assetId: string, commentId: string): Observable<Comment> {
    return this.http.get<Comment>(`${this.portalUrl}/asset/${assetId}/comment/${commentId}`);
  }

  addComment(assetId: string, comment: Comment): Observable<Comment> {
    return this.http.post<Comment>(`${this.portalUrl}/asset/${assetId}/comment`, comment);
  }

  updateComment(assetId: string, commentId: string, comment: Comment): Observable<Comment> {
    return this.http.put<Comment>(`${this.portalUrl}/asset/${assetId}/comment/${commentId}`, comment);
  }

  deleteComment(assetId: string, commentId: string): Observable<any> {
    return this.http.delete(`${this.portalUrl}/asset/${assetId}/comment/${commentId}`);
  }

  generateNewInvoice(invoiceData: any): Observable<any>{
    return this.http.post(`${this.portalUrl}/invoice`, invoiceData)
  }

  getGlance(): Observable<{glance: Glance}> {
    return this.http.get<{glance: Glance}>(`${this.portalUrl}/monitor`);
  }

  flushCache(): Observable<any> {
    return this.http.get(`${this.portalUrl}/flushcache`);
  }

}
