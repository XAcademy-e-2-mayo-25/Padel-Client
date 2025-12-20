import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { CommonModule } from "@angular/common";
import { RolService } from "../../../services/rol/rol.service";
import { AuthService } from "../../../services/auth/auth.service";
import { ROLES } from "../../../services/rol/rol.service";

@Component({
  selector: 'app-club-dashboard',
  standalone: true,
  templateUrl: './club-dashboard.component.html',
  styleUrls: ['./club-dashboard.component.css'],
  imports: [CommonModule]
})
export class ClubDashboardComponent implements OnInit {
  clubName: string = 'Club';

  constructor(
    private router: Router,
    private rolService: RolService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const userData = this.rolService.getUserData();
    if (userData) {
      this.clubName = userData.nombres || 'Club';
    }
  }

  logout(): void {
    this.authService.logout();
  }

  navigateTo(destination: string): void {
    this.router.navigate([`/${destination}`]);
  }

  goToRoleSelector(): void {
    this.router.navigate(['/rol-selector']);
  }
}
