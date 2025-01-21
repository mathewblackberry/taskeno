import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-time-ago',
  template: `{{ timeAgo }}`,
  standalone: true,
  imports: []
})
export class TimeAgoComponent implements OnInit, OnDestroy {
  @Input() dateTime: string;
  timeAgo: string;
  private timerSubscription: Subscription;

  ngOnInit() {
    this.updateTimeAgo();
    this.timerSubscription = interval(1000).subscribe(() => {
      this.updateTimeAgo();
    });
  }

  ngOnDestroy() {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  updateTimeAgo() {
    const now = new Date();
    const past = new Date(this.dateTime);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds >= 0) {
      this.timeAgo = this.formatTimeAgo(diffInSeconds);
    } else {
      this.timeAgo = 'Just now';
    }
  }


  padZero(num: number): string {
    return num < 10 ? '0' + num : num.toString();
  }

  formatTimeAgo(seconds: number): string {
    if (seconds < 300) { // Up to 5 minutes
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${this.padZero(minutes)}m${this.padZero(secs)}s`;
    } else if (seconds < 86400) { // From 5 minutes up to 24 hours
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${this.padZero(hours)}h${this.padZero(minutes)}m`;
    } else { // 24 hours and beyond
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${days}d${this.padZero(hours)}h${this.padZero(minutes)}m`;
    }
  }
}
