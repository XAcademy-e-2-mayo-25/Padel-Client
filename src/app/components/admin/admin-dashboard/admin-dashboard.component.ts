import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { CommonModule } from "@angular/common";
import { RolService } from "../../../services/rol/rol.service";
import { AuthService } from "../../../services/auth/auth.service";

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
  imports: [CommonModule]
})
export class AdminDashboardComponent implements OnInit {
  adminName: string = 'Administrador';

  constructor(
    private router: Router,
    private rolService: RolService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const userData = this.rolService.getUserData();
    if (userData) {
      this.adminName = userData.nombres || 'Administrador';
    }
  }

  logout(): void {
    this.authService.logout();
  }

  navigateTo(destination: string): void {
    this.router.navigate([`/${destination}`]);
  }
}
