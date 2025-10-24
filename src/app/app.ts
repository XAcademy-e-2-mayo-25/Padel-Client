// src/app/app.component.ts
import { Component } from '@angular/core';
import { RouterOutlet } from "@angular/router";


@Component({

  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  imports: [RouterOutlet]
})
export class App {

}
