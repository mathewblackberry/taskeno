import {CommonModule} from '@angular/common';
import {Component, inject, OnInit} from '@angular/core';
import {FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatExpansionModule} from "@angular/material/expansion";
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatListModule} from '@angular/material/list';
import {MatSelectChange, MatSelectModule} from '@angular/material/select';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatTableModule} from "@angular/material/table";
import {MatTabsModule} from '@angular/material/tabs';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatTooltipModule} from '@angular/material/tooltip';
import {AuthenticatorService} from '@aws-amplify/ui-angular';
import {IPv4CidrRange} from 'ip-num';
import {Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import {ChartComponent} from './chart.component';
import {CodeDisplayComponent} from './code-display.component';
import {AddresssComponent} from './mikrotik/address.component';
import {ArpsComponent} from './mikrotik/arp.component';
import {FirewallsComponent} from './mikrotik/firewall.component';
import {InterfacesComponent} from './mikrotik/interface.component';
import {IPAddressesComponent} from './mikrotik/ipaddress.component';
import {RoutetableComponent} from './mikrotik/routetable.component';
import {Asset, Host, MobileDetails, RouterDetails, Site, SubnetDetails, Credential} from './models/model';
import {PasswordFieldComponent} from './password-field.component';
import {SiteAssetService} from './services/site-asset-service';
import {TileComponent} from './tile.component';
import {LanSubnetsComponent} from './view/lan-subnets.component';
import {LiveToolsComponent} from './view/live-tools.component';
import {MobileDetailsComponent} from './view/mobile-details.component';
import {RouterDetailsComponent} from './view/router-details.component';
import {RouterGeneralComponent} from './view/router-general.component';

@Component({
  selector: 'app-site-list',
  templateUrl: './site-list.component.html',
  styleUrl: './site-list.component.scss',
  imports: [MatListModule, CommonModule, MatTabsModule, MatInputModule, MatAutocompleteModule, ReactiveFormsModule, FormsModule, MatCardModule, MatButtonModule,
    MatIconModule, MatTableModule, MatExpansionModule, CodeDisplayComponent, MatSelectModule, MatToolbarModule, PasswordFieldComponent, RoutetableComponent, MatTooltipModule,
    InterfacesComponent, IPAddressesComponent, ArpsComponent, FirewallsComponent, AddresssComponent, ChartComponent, TileComponent, RouterDetailsComponent, MobileDetailsComponent, LanSubnetsComponent, RouterGeneralComponent, LiveToolsComponent, MatSlideToggleModule],
  standalone: true
})
export class SiteListComponent implements OnInit {
  assetForm: FormGroup;
  siteControl: FormControl<any> = new FormControl();
  sites: Site[] = [];
  fSites: Site[] = [];
  filteredSites: Observable<Site[]>;
  selectedSite: Site | null = null;
  assets: Asset[] = [];
  selectedAsset: Asset | null = null;
  nextSiteName: string = '';
  previousSiteName: string = '';
  authenticator: AuthenticatorService = inject(AuthenticatorService);
  showActiveOnly = true;

  constructor(private siteAssetService: SiteAssetService, private fb: FormBuilder) {
    this.assetForm = this.createAssetForm();
  }

  get mobileDetailsForm(): FormGroup {
    return this.assetForm.get('routerDetails.mobileDetails') as FormGroup;
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.siteAssetService.getSites().subscribe(sites => {
        sites.forEach(site => {
          if (site.name == undefined) console.log(site);
        });
        this.sites = sites.sort((a: Site, b: Site) => a.name.localeCompare(b.name));
        this.filteredSites = this.siteControl.valueChanges.pipe(startWith(''), map(value => typeof value === 'string' ? value : value?.name), map(name => name ? this._filterSites(name) : this.sites.slice()));
        this.updateFilteredSites();
        // if(sites.length > 0) {
        //   this.onSelectSite(sites[0]);
        //   this.siteControl.setValue(sites[0], { emitEvent: false });
        // }
      });
    });

    // Initialize the form group with the structure of selectedAsset.routerDetails.mobileDetails


  }

  private _filterSites(value: string): Site[] {
    const filterValue = value.toLowerCase();
    return this.sites.filter(site =>
      site.name?.toLowerCase().includes(filterValue) &&
      (!this.showActiveOnly || site.active) // Filter based on the toggle state
    ).sort((a: Site, b: Site) => a.name.localeCompare(b.name));
  }

  onToggleChange(): void {
    this.updateFilteredSites();
  }

  updateFilteredSites(): void {
    this.filteredSites = this.siteControl.valueChanges.pipe(
      startWith(''),
      map(value => typeof value === 'string' ? value : value?.name),
      map(name => name ? this._filterSites(name) : this.sites.filter(site => !this.showActiveOnly || site.active).slice())
    );
    this.filteredSites.subscribe(filtered => {
      this.fSites = filtered;
      if (filtered.length > 0) {
        this.onSelectSite(filtered[0]);
        this.siteControl.setValue(filtered[0], {emitEvent: false});
      }
    });
  }

  onSelectSite(site: Site): void {
    this.selectedSite = site;
    this.updateTooltipValues();
    this.siteAssetService.getAssets(site.id).subscribe(assets => {
      this.assets = assets;
      if (assets)
        this.onSelectAsset(assets[0])
      else
        this.selectedAsset = null;
    });
  }

  onSelectAsset(asset: Asset): void {
    this.selectedAsset = asset;

    this.assetForm.patchValue({
      id: asset.id,
      hostname: asset.hostname,
      terminals: asset.terminals,
      carriageType: asset.carriageType,
      carriageFNN: asset.carriageFNN,
      carriagePort: asset.carriagePort,
      FNN: asset.FNN,
      POI: asset.POI,
      active: asset.active
    });

    this.setSubnetDetailsArray(this.assetForm.get('lanSubnets') as FormArray, asset.lanSubnets);
    this.setIPv4CidrRangeArray(this.assetForm.get('wanSubnets') as FormArray, asset.wanSubnets);
    this.setIPv4CidrRangeArray(this.assetForm.get('loopbacks') as FormArray, asset.loopbacks);
    this.setRouterDetailsForm(this.assetForm.get('routerDetails') as FormGroup, asset.routerDetails);

  }

  onSelectAssetChanged(event: MatSelectChange) {
    this.onSelectAsset(event.value);
  }

  displaySite(site: Site): string {
    return site && site.name ? site.name : '';
  }

  selectNextSite() {
    let site: Site | null = null;
    if (!this.selectedSite) {
      site = this.fSites[0];
    } else {
      const currentIndex = this.fSites.findIndex(site => site.id === this.selectedSite!.id);
      const nextIndex = (currentIndex + 1) % this.fSites.length;
      site = this.fSites[nextIndex];
    }
    this.onSelectSite(site)
    this.siteControl.setValue(site, {emitEvent: false});
  }

  selectPreviousSite() {
    let site: Site | null = null;
    if (!this.selectedSite) {
      site = this.fSites[this.fSites.length - 1]; // If selectedSite is null, select the last site
    } else {
      const currentIndex = this.fSites.findIndex(site => site.id === this.selectedSite!.id);
      const previousIndex = (currentIndex - 1 + this.fSites.length) % this.fSites.length;
      site = this.fSites[previousIndex];
    }
    this.onSelectSite(site)
    this.siteControl.setValue(site, {emitEvent: false});
  }

  updateTooltipValues() {
    if (!this.selectedSite) {
      this.nextSiteName = this.fSites.length ? this.fSites[0].name : '';
      this.previousSiteName = this.fSites.length ? this.fSites[this.fSites.length - 1].name : '';
    } else {
      const currentIndex = this.fSites.findIndex(site => site.id === this.selectedSite!.id);
      const nextIndex = (currentIndex + 1) % this.fSites.length;
      const previousIndex = (currentIndex - 1 + this.fSites.length) % this.fSites.length;
      this.nextSiteName = this.fSites[nextIndex].name;
      this.previousSiteName = this.fSites[previousIndex].name;
    }
  }

  show() {
    console.log(JSON.stringify(this.assetForm.value, null, 2));
  }


  createAssetForm(): FormGroup {
    return this.fb.group({
      id: [''],
      hostname: ['', Validators.required],
      terminals: [null, Validators.required],
      lanSubnets: this.fb.array([]),
      wanSubnets: this.fb.array([]),
      loopbacks: this.fb.array([]),
      carriageType: ['', Validators.required],
      carriageFNN: ['', Validators.required],
      carriagePort: ['', Validators.required],
      FNN: ['', Validators.required],
      POI: ['', Validators.required],
      routerDetails: this.createRouterDetailsForm(),
      active: [false]
    });
  }

  setAssetFormData(asset: Asset, form: FormGroup): void {
    form.patchValue({
      id: asset.id,
      hostname: asset.hostname,
      terminals: asset.terminals,
      carriageType: asset.carriageType,
      carriageFNN: asset.carriageFNN,
      carriagePort: asset.carriagePort,
      FNN: asset.FNN,
      POI: asset.POI,
      active: asset.active
    });

    this.setSubnetDetailsArray(form.get('lanSubnets') as FormArray, asset.lanSubnets);
    this.setIPv4CidrRangeArray(form.get('wanSubnets') as FormArray, asset.wanSubnets);
    this.setIPv4CidrRangeArray(form.get('loopbacks') as FormArray, asset.loopbacks);
    this.setRouterDetailsForm(form.get('routerDetails') as FormGroup, asset.routerDetails);
  }

  createSubnetDetailsArray(): FormArray {
    return this.fb.array([]);
  }

  setSubnetDetailsArray(array: FormArray, subnets: SubnetDetails[]): void {
    subnets.forEach(subnet => array.push(this.fb.group({
      subnet: [subnet.subnet.toString(), Validators.required],
      hosts: this.fb.array(this.createHostArray(subnet.hosts))
    })));
  }

  createIPv4CidrRangeArray(): FormArray {
    return this.fb.array([]);
  }

  setIPv4CidrRangeArray(array: FormArray, ranges: IPv4CidrRange[]): void {
    ranges.forEach(range => array.push(this.fb.control(range.toString(), Validators.required)));
  }

  createRouterDetailsForm(): FormGroup {
    return this.fb.group({
      defaultCredentials: this.createCredentialForm(),
      credentials: this.fb.array([]),
      serialNumber: ['', Validators.required],
      model: ['', Validators.required],
      manufacturer: ['', Validators.required],
      mobileDetails: this.createMobileDetailsForm()
    });
  }

  setRouterDetailsForm(form: FormGroup, routerDetails?: RouterDetails): void {
    if (!routerDetails) return;
    form.patchValue({
      serialNumber: routerDetails.serialNumber,
      model: routerDetails.model,
      manufacturer: routerDetails.manufacturer
    });
    this.setCredentialsArray(form.get('credentials') as FormArray, routerDetails.credentials);
    this.setMobileDetailsForm(form.get('mobileDetails') as FormGroup, routerDetails.mobileDetails);
  }

  createCredentialForm(): FormGroup {
    return this.fb.group({
      username: ['', Validators.required],
      password: [''],
      purpose: ['']
    });
  }

  setCredentialsArray(array: FormArray, credentials: Credential[]): void {
    credentials.forEach(credential => {
      const credForm = this.createCredentialForm();
      credForm.patchValue(credential);
      array.push(credForm);
    });
  }

  createMobileDetailsForm(): FormGroup {
    return this.fb.group({
      username: [''],
      password: [''],
      firstName: [''],
      lastName: [''],
      framedIP: [''],
      framedRoutes: this.fb.array([]),
      simSerial: ['', Validators.required],
      mobileNumber: [''],
      PUK: ['']
    });
  }

  setMobileDetailsForm(form: FormGroup, mobileDetails?: MobileDetails): void {
    if (!mobileDetails) return;
    form.patchValue({
      username: mobileDetails.username,
      password: mobileDetails.password,
      firstName: mobileDetails.firstName,
      lastName: mobileDetails.lastName,
      framedIP: mobileDetails.framedIP?.toString(),
      simSerial: mobileDetails.simSerial,
      mobileNumber: mobileDetails.mobileNumber,
      PUK: mobileDetails.PUK
    });
    this.setIPv4CidrRangeArray(form.get('framedRoutes') as FormArray, mobileDetails.framedRoutes || []);
  }

  createHostArray(hosts: Host[]): FormGroup[] {
    return hosts.map(host => this.fb.group({
      ip: [host.ip.toString(), Validators.required],
      name: [host.name, Validators.required],
      active: [host.active],
      defaultGateway: [host.defaultGateway],
      network: [host.network],
      broadcast: [host.broadcast]
    }));
  }

  protected readonly FormGroup = FormGroup;
}
