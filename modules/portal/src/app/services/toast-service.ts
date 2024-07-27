import {Injectable} from '@angular/core';

declare var bootstrap: any;

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  constructor() {
  }

  showErrorToast(message: string) {
    const toastBody = document.getElementById('toastBody');
    if (toastBody) {
      toastBody.textContent = message;
    }
    const errorToast = document.getElementById('errorToast');
    if (errorToast) {
      const toast = new bootstrap.Toast(errorToast);
      toast.show();
    }
  }

  showErrorAlert(message: string) {
    const alertPlaceholder = document.getElementById('alertPlaceholder');
    if (alertPlaceholder) {
      const alertId = `alert-${new Date().getTime()}`; // Unique ID for each alert
      const alertElement = document.createElement('div');
      alertElement.setAttribute('id', alertId);
      alertElement.setAttribute('class', 'alert alert-danger alert-dismissible fade show');
      alertElement.setAttribute('role', 'alert');
      alertElement.setAttribute('style', 'position: fixed; top: 0; right: 0; margin: 20px; z-index: 1050;');
      alertElement.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      `;
      alertPlaceholder.appendChild(alertElement);
      this.adjustAlertPositions();
      // Adjust position of new alerts to stack them
      const alerts = alertPlaceholder.getElementsByClassName('alert');
      for (let i = 0; i < alerts.length; i++) {
        alerts[i].setAttribute('style', `position: fixed; top: ${(i * 60)}px; right: 0; margin: 20px; z-index: 1050;`);
      }
      setTimeout(() => {
        const alertToClose = bootstrap.Alert.getOrCreateInstance(alertElement);
        alertToClose.close();
      }, 10000);

      alertElement.addEventListener('closed.bs.alert', () => {
        this.adjustAlertPositions();
      });
    }
  }

  showSuccessAlert(message: string) {
    const alertPlaceholder = document.getElementById('alertPlaceholder');
    if (alertPlaceholder) {
      const alertId = `alert-${new Date().getTime()}`; // Unique ID for each alert
      const alertElement = document.createElement('div');
      alertElement.setAttribute('id', alertId);
      alertElement.setAttribute('class', 'alert alert-danger alert-dismissible fade show');
      alertElement.setAttribute('role', 'alert');
      alertElement.setAttribute('style', 'position: fixed; top: 0; right: 0; margin: 20px; z-index: 1050;');
      alertElement.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      `;
      alertPlaceholder.appendChild(alertElement);
      this.adjustAlertPositions();
      // Adjust position of new alerts to stack them
      const alerts = alertPlaceholder.getElementsByClassName('alert');
      for (let i = 0; i < alerts.length; i++) {
        alerts[i].setAttribute('style', `position: fixed; top: ${(i * 60)}px; right: 0; margin: 20px; z-index: 1050;`);
      }
      setTimeout(() => {
        const alertToClose = bootstrap.Alert.getOrCreateInstance(alertElement);
        alertToClose.close();
      }, 10000);

      alertElement.addEventListener('closed.bs.alert', () => {
        this.adjustAlertPositions();
      });
    }
  }

  private adjustAlertPositions() {
    const alertPlaceholder = document.getElementById('alertPlaceholder');
    if (alertPlaceholder) {
      const alerts = alertPlaceholder.getElementsByClassName('alert');
      for (let i = 0; i < alerts.length; i++) {
        (alerts[i] as HTMLElement).style.top = `${(i * 60)}px`;
      }
    }
  }
}
