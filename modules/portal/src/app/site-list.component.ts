import {CommonModule} from '@angular/common';
import {Component, inject, OnInit} from '@angular/core';
import {FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatDialog} from '@angular/material/dialog';
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
import {Asset, Comment, Credential, Host, MobileDetails, RouterDetails, Site, SubnetDetails} from './models/model';
import {PasswordFieldComponent} from './password-field.component';
import {AuthService} from './services/auth-service';
import {SiteAssetService} from './services/site-asset-service';
import {TileComponent} from './tile.component';
import {IPValidators} from './validators/ip-cidr-validator';
import {CommentsComponent} from './view/comment.component';
import {DatePickerDialogComponent} from './view/invoice-selector-dialog';
import {LanSubnetsComponent} from './view/lan-subnets.component';
import {LiveToolsComponent} from './view/live-tools.component';
import {MobileDetailsComponent} from './view/mobile-details.component';
import {RouterDetailsComponent} from './view/router-details.component';

import {RouterGeneralComponent} from './view/router-general.component';
import {SiteEditDialogComponent} from './view/site-edit-dialog';

@Component({
  selector: 'app-site-list',
  templateUrl: './site-list.component.html',
  styleUrl: './site-list.component.scss',
  imports: [MatListModule, CommonModule, MatTabsModule, MatInputModule, MatAutocompleteModule, ReactiveFormsModule, FormsModule, MatCardModule, MatButtonModule,
    MatIconModule, MatTableModule, MatExpansionModule, CodeDisplayComponent, MatSelectModule, MatToolbarModule, PasswordFieldComponent, RoutetableComponent, MatTooltipModule,
    InterfacesComponent, IPAddressesComponent, ArpsComponent, FirewallsComponent, AddresssComponent, ChartComponent, TileComponent, RouterDetailsComponent, MobileDetailsComponent,
    LanSubnetsComponent, RouterGeneralComponent, LiveToolsComponent, MatSlideToggleModule, CommentsComponent],
  standalone: true
})
export class SiteListComponent implements OnInit {
  pattern = /^[a-z]{6}r\d{2}m[a-z0-9]{3}$/
  assetForm: FormGroup;
  siteForm: FormGroup;
  siteControl: FormControl<any> = new FormControl();
  sites: Site[] = [];
  fSites: Site[] = [];
  filteredSites: Observable<Site[]>;
  selectedSite: Site | null = null;
  assets: Asset[] = [];
  comments: Comment[] = [];
  selectedAsset: Asset | null = null;
  nextSiteName: string = '';
  previousSiteName: string = '';
  authenticator: AuthenticatorService = inject(AuthenticatorService);
  private dialog: MatDialog = inject(MatDialog);
  showActiveOnly = true;
  isEditMode: boolean = false;

  authService: AuthService = inject(AuthService);

  constructor(private siteAssetService: SiteAssetService, private fb: FormBuilder) {
    this.assetForm = this.createAssetForm();
    this.siteForm = this.createSiteForm();

  }

  get mobileDetailsForm(): FormGroup {
    return this.assetForm.get('routerDetails.mobileDetails') as FormGroup;
  }

  get routerDetailsForm(): FormGroup {
    return this.assetForm.get('routerDetails') as FormGroup;
  }

  get routerGeneralForm(): FormGroup {
    return this.assetForm;
  }

  get lanSubnets(): FormArray {
    return this.assetForm.get('lanSubnets') as FormArray;
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
        this.selectNextSite();
      });
    });

    // Initialize the form group with the structure of selectedAsset.routerDetails.mobileDetails

  }

  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
  };

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
    });
  }

  onSelectSite(site: Site): void {
    this.isEditMode = false
    this.selectedSite = site;
    this.updateTooltipValues();
    this.siteAssetService.getAssets(site.id).subscribe(assets => {
      this.assets = assets;
      if (assets)
        this.onSelectAsset(assets[0])
      else {
        this.selectedAsset = null;
        this.comments = [];
      }
    });
    this.populateSiteForm(site);
  }

  onSelectAsset(asset: Asset): void {
    this.comments = [];
    this.selectedAsset = asset;
    this.setAssetFormData(asset, this.assetForm);
    this.siteAssetService.getComments(asset.id).subscribe(comments => {
      this.comments = comments;
    });
  }

  onSelectAssetChanged(event: MatSelectChange) {
    this.onSelectAsset(event.value);
  }

  displaySite(site: Site): string {
    return site && site.name ? site.name : '';
  }

  selectNextSite() {
    this.isEditMode = false;
    let site: Site | null = null;
    if (!this.selectedSite) {
      site = this.fSites[0];
    } else {
      // console.log(JSON.stringify(this.fSites, null, 2));
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

  createSiteForm(): FormGroup {
    return this.fb.group({
      id: ['', Validators.required],
      name: ['', Validators.required],
      address: ['', Validators.required],
      address2: [''], // Optional field, no validators needed
      city: ['', Validators.required],
      state: ['', Validators.required],
      postcode: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]*$/)]], // Example validation for phone numbers
      email: ['', [Validators.required, Validators.email]],
      latitude: [''],
      longitude: [''],

      active: [false, Validators.required] // Default to false, with a required validator
    });
  }

  // Example function to populate the form with data
  populateSiteForm(site: Site) {
    this.siteForm.patchValue({
      id: site.id,
      name: site.name,
      address: site.address,
      address2: site.address2,
      city: site.city,
      state: site.state,
      postcode: site.postcode,
      phone: site.phone,
      email: site.email,
      latitude: site.latitude,
      longitude: site.longitude,
      active: site.active
    });
  }

  createAssetForm(): FormGroup {
    return this.fb.group({
      id: [''],
      hostname: ['', Validators.required],
      terminals: [null],
      lanSubnets: this.fb.array([]),
      wanSubnets: this.fb.array([]),
      loopbacks: this.fb.array([]),
      carriageType: ['', Validators.required],
      carriageFNN: ['', Validators.required],
      carriagePort: ['', Validators.required],
      FNN: [''],
      POI: ['', Validators.required],
      routerDetails: this.createRouterDetailsForm(),
      active: [false]
    });
  }

  setAssetFormData(asset: Asset, form: FormGroup): void {
    Object.keys(form.controls).forEach(key => {
      if (form.get(key) instanceof FormArray) {
        (form.get(key) as FormArray).clear();
      } else {
        form.removeControl(key);
      }
    });

    form.addControl('id', new FormControl(asset.id));
    form.addControl('hostname', new FormControl(asset.hostname));
    form.addControl('terminals', new FormControl(asset.terminals));
    form.addControl('carriageType', new FormControl(asset.carriageType));
    form.addControl('carriageFNN', new FormControl(asset.carriageFNN ?? 'N/A'));
    form.addControl('carriagePort', new FormControl(asset.carriagePort ?? 'N/A'));
    form.addControl('FNN', new FormControl(asset.FNN));
    form.addControl('POI', new FormControl(asset.POI));
    form.addControl('active', new FormControl(asset.active));
    form.addControl('lanSubnets', new FormArray([]));
    form.addControl('wanSubnets', new FormArray([]));
    form.addControl('loopbacks', new FormArray([]));
    form.addControl('routerDetails', this.createRouterDetailsForm());

    this.setSubnetDetailsArray(this.assetForm.get('lanSubnets') as FormArray, asset.lanSubnets);
    this.setIPv4CidrRangeArray(this.assetForm.get('wanSubnets') as FormArray, asset.wanSubnets, 'cidr notation');
    this.setIPv4CidrRangeArray(this.assetForm.get('loopbacks') as FormArray, asset.loopbacks, 'ip');
    // console.log(JSON.stringify(asset.loopbacks,null,1));
    this.setRouterDetailsForm(this.assetForm.get('routerDetails') as FormGroup, asset.routerDetails);
  }

  setSubnetDetailsArray(array: FormArray, subnets: SubnetDetails[]): void {
    subnets.forEach(subnet => array.push(this.fb.group({
      subnet: [subnet.subnet.toString(), [Validators.required, IPValidators.ipCidrValidator('cidr range')]],
      hosts: this.fb.array(this.createHostArray(subnet.hosts))
    })));
  }

  setIPv4CidrRangeArray(array: FormArray, ranges: IPv4CidrRange[], type: 'ip' | 'cidr range' | 'cidr notation'): void {
    if (!ranges)
      ranges = [];
    ranges.forEach(range => array.push(this.fb.control(range.toString(), [Validators.required, IPValidators.ipCidrValidator(type)])));
  }

  createRouterDetailsForm(): FormGroup {
    return this.fb.group({
      defaultCredentials: this.createCredentialForm(),
      credentials: this.fb.array([]),
      serialNumber: ['', Validators.required],
      model: ['', Validators.required],
      manufacturer: ['', Validators.required],
      // mobileDetails: this.createMobileDetailsForm()
    });
  }

  setRouterDetailsForm(form: FormGroup, routerDetails?: RouterDetails): void {
    if (!routerDetails) return;
    form.patchValue({
      serialNumber: routerDetails.serialNumber,
      model: routerDetails.model,
      manufacturer: routerDetails.manufacturer
    });
    this.setDefaultCredentialForm(form.get('defaultCredentials') as FormGroup, routerDetails.defaultCredentials);
    this.setCredentialsArray(form.get('credentials') as FormArray, routerDetails.credentials);

      // this.setMobileDetailsForm(form.get('mobileDetails') as FormGroup, routerDetails.mobileDetails);

    if (routerDetails.mobileDetails) {
      // Dynamically create and add mobileDetails if it exists in routerDetails
      const mobileDetailsForm = this.createMobileDetailsForm();
      form.addControl('mobileDetails', mobileDetailsForm);
      this.setMobileDetailsForm(mobileDetailsForm, routerDetails.mobileDetails);
    }

  }

  createCredentialForm(): FormGroup {
    return this.fb.group({
      username: [''],
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

  setDefaultCredentialForm(form: FormGroup, credential?: Credential): void {
    if (!credential) return;
    form.patchValue({
      username: credential.username,
      password: credential.password,
      purpose: credential.purpose
    });
  }

  createMobileDetailsForm(): FormGroup {
    return this.fb.group({
      username: [''],
      password: [''],
      firstName: [''],
      lastName: [''],
      framedIP: ['', [IPValidators.ipCidrValidator('ip')]],
      framedRoutes: this.fb.array([]),
      simSerial: ['', Validators.pattern(/^\d{4}\s?\d{4}\s?\d{4}\s?\dN$/)],
      mobileNumber: ['', Validators.pattern(/^\d{3,4}\s?\d{3}\s?\d{3}$/)],
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
    this.setIPv4CidrRangeArray(form.get('framedRoutes') as FormArray, mobileDetails.framedRoutes || [], 'cidr range');
  }

  createHostArray(hosts: Host[]): FormGroup[] {
    return hosts.map(host => this.fb.group({
      ip: [host.ip.toString(), Validators.required],
      name: [host.name],
      active: [host.active]
    }));
  }

  updateAsset() {
    this.siteAssetService.updateAsset(this.selectedSite!.id, this.selectedAsset!.id, this.assetForm.value).subscribe(
      response => {
        this.isEditMode = false;
      });

  }

  openSiteEditDialog(): void {
    const dialogRef = this.dialog.open(SiteEditDialogComponent, {
      width: '600px',
      data: this.selectedSite
    });

    dialogRef.afterClosed().subscribe(result => {

      if (result) {
        this.siteAssetService.updateSite(result).subscribe((response) => {
          const index = this.sites.findIndex(site => site.id === result.id);

          if (index !== -1) {
            this.sites[index] = result;
            if (this.selectedSite?.id === result.id) {
              this.selectedSite = result;
            }
          }
        });
      }
    });
  }

  openInvoiceDialog(): void {
    const dialogRef = this.dialog.open(DatePickerDialogComponent, {
      width: '600px',
      data: this.selectedSite
    });

    dialogRef.afterClosed().subscribe(result => {

      if (result) {
        console.log(result);
        this.siteAssetService.generateNewInvoice(result).subscribe(response => {
          console.log(response);
        });
      }

    });
  }

  flushCache(){
    this.siteAssetService.flushCache().subscribe((response) => {

    });
  }

  toggleSiteActive() {
    const updatedSite: Site = JSON.parse(JSON.stringify(this.selectedSite));
    updatedSite.active = !updatedSite.active;

    this.siteAssetService.updateSite(updatedSite).subscribe((response) => {
      const index = this.sites.findIndex(site => site.id === updatedSite.id);

      if (index !== -1) {
        this.sites[index] = updatedSite;
        if (this.selectedSite?.id === updatedSite.id) {
          this.selectedSite = updatedSite;
        }
      }
    });

  }

  copyHostname(hostname: string) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(hostname).then(() => {
          console.log('Password copied to clipboard');
        },
        err => {
          console.error('Failed to copy password: ', err);
        }
      );
    } else {
      this.fallbackCopyText(hostname);
    }
  }

  fallbackCopyText(text: string) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';  // Prevent scrolling to bottom of page in MS Edge.
    textarea.style.left = '-9999px'; // Move textarea out of the viewport
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      const successful = document.execCommand('copy');
      const msg = successful ? 'successful' : 'unsuccessful';
      console.log(`Fallback: Copying text command was ${msg}`);
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
    }
    document.body.removeChild(textarea);
  }

}
