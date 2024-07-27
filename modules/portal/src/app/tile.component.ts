import {Component, inject, Input} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {SiteAssetService} from './services/site-asset-service';

@Component({
  selector: 'app-tile',
  standalone: true,
  imports: [MatCardModule, MatButtonModule],
  template: `
    <mat-card class="tile">
      <button mat-raised-button color="primary" (click)="action()">{{ buttonText }}</button>
    </mat-card>
  `,
  styles: [`
    .tile {
      width: 250px;
      height: 250px;
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 10px;
    }

  `]
})
export class TileComponent {
  @Input() action: () => void;
  @Input() buttonText: string;
}
