import { Component ,input,output} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';


@Component({
  selector: 'app-left-sidebar',  
  imports: [RouterModule, CommonModule],
  templateUrl: './left-sidebar.html',
  styleUrl: './left-sidebar.css'
})
export class LeftSidebar {
   isLeftSidebarCollapsed = input.required<boolean>();
  changeIsLeftSidebarCollapsed = output<boolean>();
  items = [
    {
      routeLink:'dashboard',
      icon:'fa fa-home',
      label:'Dashboard',
    },   
    
  
  
    {
      routeLink:'signout',
      icon:'bi bi-box-arrow-right',
      label:'Sign Out',
    }
  ];
   showSignOutConfirm = false;
  constructor(private router: Router) {}


  onSignOutClick(event: Event) {
  event.preventDefault(); // Prevent navigation
  this.showSignOutConfirm = true;
}

  confirmSignOut() {  
    localStorage.clear();
    sessionStorage.clear();
    this.showSignOutConfirm = false;
    this.router.navigateByUrl('/login',{replaceUrl: true}); // This replaces history
  }

  cancelSignOut() {
    this.showSignOutConfirm = false;
  }
  toggleCollapse(): void {
    this.changeIsLeftSidebarCollapsed.emit(!this.isLeftSidebarCollapsed());
  }

  closeSidenav(): void {
    this.changeIsLeftSidebarCollapsed.emit(true);
  }
}
