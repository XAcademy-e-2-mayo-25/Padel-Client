import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from '../../components/shared/footer/footer.component';

@Component({
  selector: 'app-main-layout',
  template: `
    <router-outlet></router-outlet>
    <app-footer></app-footer>
  `,
  standalone: true,
  imports: [RouterOutlet, FooterComponent]
})
export class MainLayoutComponent {}