import {CommonModule} from '@angular/common';
import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import * as Highcharts from 'highcharts';
import {HighchartsChartModule} from 'highcharts-angular';
import {Asset} from './models/model';
import {SiteAssetService} from './services/site-asset-service';

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [HighchartsChartModule, ReactiveFormsModule, MatInputModule, MatSelectModule, CommonModule, MatButtonModule, MatIconModule, MatCardModule],
  template: `
    <div style="width: 100%; height: 100%; display: flex; flex-direction: column">
      <form [formGroup]="form" (ngSubmit)="fetchData()" class="form-container">
        <mat-card>
          <mat-card-content>
            <div class="form-field">
              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>Interface</mat-label>
                <mat-select formControlName="port">
                  <mat-option *ngFor="let port of ports" [value]="port.value">
                    {{ port.label }}
                  </mat-option>
                </mat-select>
                <mat-error *ngIf="form.get('port')?.hasError('required')">
                  Port is required
                </mat-error>
              </mat-form-field>
              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>Time Range</mat-label>
                <mat-select formControlName="timeRange">
                  <mat-option *ngFor="let timeRange of timeRanges" [value]="timeRange.value">
                    {{ timeRange.label }}
                  </mat-option>
                </mat-select>
                <mat-error *ngIf="form.get('timeRange')?.hasError('required')">
                  Time Range is required
                </mat-error>
              </mat-form-field>
              <button mat-icon-button color="primary" type="submit">
                <mat-icon>send</mat-icon>
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </form>

      @if (rowData.length) {
        <div style="flex: 1; display: flex; width: 100%;">
          <highcharts-chart
            [Highcharts]="Highcharts"
            [options]="chartOptions"
            [oneToOne]="true" style="flex: 1"/>
        </div>
      } </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
    .form-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }

    .form-field {
      margin-bottom: 16px;
      display: flex;
      justify-content: space-evenly;
      align-items: center;
    }

    .form-field > mat-form-field {
      padding: 2px;
    }

    mat-card {
      padding: 20px;
    }

    mat-card-title {
      text-align: center;
    }

    mat-card-actions {
      display: flex;
      justify-content: center;
    }

    button mat-icon {
      margin-right: 8px;
    }
  `]
})
export class ChartComponent implements OnInit, OnChanges {
  @Input({required: true}) siteId: string;
  @Input({required: true}) asset: Asset;

  Highcharts: typeof Highcharts = Highcharts;
  chartOptions: Highcharts.Options = {};
  public rowData: any[] = [];
  public unit: string = 'kb/s';
  form: FormGroup;


  ports_dc1 = [
    { value: 'wan', label: 'WAN' },
    { value: 'core', label: 'Core' },
    { value: 'south', label: 'South' },
    { value: 'north', label: 'North' }];
  ports_dc2 = [
    {value: 'wan', label: 'WAN'},
    {value: 'core', label: 'Core'},
    {value: 'south', label: 'South'},
    {value: 'north', label: 'North'}];

  ports_venue = [
    { value: 'nbn', label: 'NBN' },
    { value: 'lte', label: 'Wireless' }
  ];
  ports = [
    { value: 'nbn', label: 'NBN' },
    { value: 'lte', label: 'Wireless' }
  ];


  timeRanges = [
    { value: '15m', label: 'Last 15 Minutes' },
    { value: '1h', label: 'Last 1 Hour' },
    { value: '3h', label: 'Last 3 Hours' },
    { value: '6h', label: 'Last 6 Hours' },
    { value: '12h', label: 'Last 12 Hours' },
    { value: '1d', label: 'Last 1 Day' },
    { value: '3d', label: 'Last 3 Days' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' }
  ];


  constructor(private dataService: SiteAssetService, private fb: FormBuilder) {
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      port: ['nbn', Validators.required],
      timeRange: ['1h', Validators.required]
    });
  }


  ngOnChanges(changes: SimpleChanges) {
    if (changes['asset'] && changes['asset'].currentValue && changes['asset'].previousValue && changes['asset'].currentValue.id != changes['asset'].previousValue.id) {
      // console.log(changes['asset']);
      if(changes['asset'].currentValue['hostname'].startsWith('tkowphr01')) this.ports  = this.ports_dc1;
      else if(changes['asset'].currentValue['hostname'].startsWith('tkowphr02')) this.ports  = this.ports_dc2;
      else this.ports = this.ports_venue;
      this.form.patchValue({port: this.ports[0].value})
     this.rowData=[]
    }
  }

  fetchData(): void {
    if(this.form.invalid)
      return;
    const host = this.asset.hostname;
    const port = this.form.value.port;//'nbn';
    const timeRange = this.form.value.timeRange; //'5m';
    this.rowData = [];
    this.dataService.getTrafficData(this.siteId, this.asset.id, host, port, timeRange).subscribe(data => {
      this.rowData = this.processData(data);
      if (this.rowData.length > 0)
        this.determineUnit();
      this.createChart();
    });
  }

  processData(data: any): any[] {
    if (!(data.inoctets.results[0] && data.outoctets.results[0].series && data.outoctets.results[0] && data.outoctets.results[0].series)) {
      return [];
    }
    const inData = data.inoctets.results[0].series[0].values;
    const outData = data.outoctets.results[0].series[0].values;

    const inboundSeries = inData.map((item: any[]) => ([
      new Date(item[0]).getTime(),
      item[1] * -1
    ]));


    const outboundSeries = outData.map((item: any[]) => ([
      new Date(item[0]).getTime(),
      item[1]
    ]));

    return [
      {
        name: 'Download',
        lineWidth: 0.75,
        data: inboundSeries,
        color: '#000000',
        lineColor: '#000000',
        fillColor: {
          linearGradient: {x1: 0, y1: 0, x2: 0, y2: 1},
          stops: [
            [0, 'rgba(0,0,0,0.1)'],
            [1, '#000000']
          ]
        }
      },
      {
        name: 'Upload',
        lineWidth: 0.75,
        data: outboundSeries,
        color: '#ff0000',
        lineColor: '#ff0000',
        fillColor: {
          linearGradient: {x1: 0, y1: 0, x2: 0, y2: 1},
          stops: [
            [0, '#ff0000'],
            [1, 'rgba(255,0,0,0.1)']
          ]
        }
      }
    ];
  }

  determineUnit(): void {
    const maxInOctets = Math.max(...this.rowData[0].data.map((d: any) => d.y));
    const maxOutOctets = Math.max(...this.rowData[1].data.map((d: any) => d.y));
    const maxOctets = Math.max(maxInOctets, maxOutOctets);

    this.unit = maxOctets > 1000000 ? 'mb/s' : 'kb/s';
  }

  createChart(): void {
    const component = this; // Store the component context





    this.chartOptions = {
      accessibility: {
        enabled: false
      },
      chart: {
        zooming: {
          type: 'x'
        },
        type: 'area'
      },
      title: {
        text: `Network Traffic (${this.unit})`
      },
      xAxis: {
        type: 'datetime',
        title: {
          text: 'Time'
        },
        events: {
          setExtremes: function (e: any) {
            const chart = this.chart;
            const diff = e.max - e.min;

            chart.update({
              xAxis: {
                labels: {
                  formatter: function () {
                    const date = new Date(this.value);
                    if (diff < 24 * 60 * 60 * 1000) { // Less than a day
                      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    } else { // More than a day
                      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                    }
                  }
                }
              }
            }, false);
          }
        },
        labels: {
          formatter: function () {
            const chart = this.chart;
            const xAxis = chart.xAxis[0];
            const extremes = xAxis.getExtremes();
            const diff = extremes.max - extremes.min;
            const date = new Date(this.value);

            if (diff < 24 * 60 * 60 * 1000) { // Less than a day
              return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } else { // More than a day
              return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
            }
          }
        }
      },
      yAxis: {
        title: {
          text: `Traffic (${this.unit})`
        },
        labels: {
          formatter: function () {
            return component.unit === 'kb/s'
              ? `${Math.abs(((this.value as number) / 1000)).toFixed(2)} ${component.unit}`
              : `${Math.abs(((this.value as number) / 1000000)).toFixed(2)} ${component.unit}`;
          }
        }
      },
      tooltip: {
        formatter: function () {
          const date = new Date(this.x!);
          const formattedDate = date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
          return `<b>${formattedDate}</b><br/>${this.series.name}: ${
            component.unit === 'kb/s'
              ? `${Math.abs((this.y! / 1000)).toFixed(2)} ${component.unit}`
              : `${Math.abs((this.y! / 1000000)).toFixed(2)} ${component.unit}`
          }`;
        }
      },
      responsive: {
        rules: [{
          condition: {
            maxWidth: 900
          },
          chartOptions: {
            legend: {
              layout: 'horizontal',
              align: 'center',
              verticalAlign: 'bottom'
            }
          }
        }]
      },
      series: this.rowData
    };
  }
}
