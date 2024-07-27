import { Component, OnInit } from '@angular/core';
import * as Highcharts from 'highcharts';
import {HighchartsChartModule} from 'highcharts-angular';
import { SiteAssetService } from './services/site-asset-service';

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [HighchartsChartModule],
  template: `
    <div style="width: 100%; height: 100%; display: flex;">
      <highcharts-chart
        [Highcharts]="Highcharts"
        [options]="chartOptions"
        [oneToOne]="true" style="flex: 1"/>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
  `]
})
export class ChartComponent implements OnInit {
  Highcharts: typeof Highcharts = Highcharts;
  chartOptions: Highcharts.Options = {};
  public rowData: any[] = [];
  public unit: string = 'kb/s';

  constructor(private dataService: SiteAssetService) { }

  ngOnInit(): void {
    this.fetchData();
  }

  fetchData(): void {
    const host = 'tkoaler01mlt6';
    const port = 'nbn';
    const timeRange = '1h';

    this.dataService.getTrafficData('sid', 'aid', host, port, timeRange).subscribe(data => {
      this.rowData = this.processData(data);
      this.determineUnit();
      this.createChart();
    });
  }

  processData(data: any): any[] {
    const inData = data.inoctets.results[0].series[0].values;
    const outData = data.outoctets.results[0].series[0].values;

    const inboundSeries = inData.map((item: any[]) => ({
      x: new Date(item[0]).getTime(),
      y: item[1] * -1
    }));

    const outboundSeries = outData.map((item: any[]) => ({
      x: new Date(item[0]).getTime(),
      y: item[1]
    }));

    return [
      {
        name: 'Download',
        lineWidth: 0.75,
        data: inboundSeries,
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, Highcharts.color(Highcharts.getOptions().colors![0]).setOpacity(0.1).get('rgba')],
            [1, Highcharts.getOptions().colors![0]],
          ]
        }
      },
      {
        name: 'Upload',
        lineWidth: 0.75,
        data: outboundSeries,
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, Highcharts.getOptions().colors![1]],
            [1, Highcharts.color(Highcharts.getOptions().colors![1]).setOpacity(0.1).get('rgba')],
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
        zooming:{
          type: 'x'
        },
        type: 'area',
      },
      title: {
        text: `Network Traffic (${this.unit})`
      },
      xAxis: {
        type: 'datetime',
        title: {
          text: 'Time'
        },
        labels: {
          formatter: function () {
            const date = new Date(this.value);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'});
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
              : `${Math.abs(((this.value as number)/ 1000000)).toFixed(2)} ${component.unit}`;
          }
        }
      },
      tooltip: {
        formatter: function () {
          const date = new Date(this.x!);
          const formattedDate = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
