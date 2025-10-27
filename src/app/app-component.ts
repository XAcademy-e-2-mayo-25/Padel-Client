//// Padel-Client/src/app/app-component.ts
import { Component } from '@angular/core';
import { RouterOutlet } from "@angular/router";
import { FooterComponent } from "./components/shared/footer/footer.component";

@Component({
  selector: 'app-root',
  templateUrl: './app-component.html',
  styleUrls: ['./app-component.css'],
  imports: [RouterOutlet, FooterComponent]
})
export class AppComponent {
  
 }