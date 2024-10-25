import {Component, Input} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';

@Component({
  selector: 'app-tile',
  standalone: true,
  imports: [MatCardModule, MatButtonModule],
  template: `
    <mat-card class="tile">
      <button mat-raised-button color="primary" (click)="action()">{{ buttonText }}</button>
      <span class="tile-message">{{ message }}</span>
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

    .tile-message {
      padding-top: 4px;
      font-size: 80%;
      text-transform: uppercase;
    }
  `]
})
export class TileComponent {
  @Input() action: () => void;
  @Input() buttonText: string;
  @Input() message: string;
}
