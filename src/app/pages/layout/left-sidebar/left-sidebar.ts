import { Component ,Input,input,OnInit,output} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';

enum UserRole {
  SUPERADMIN = "SUPERADMIN",
  ADMIN = "ADMIN",
  UNITHEAD = "UNITHEAD",
  UNDEFINED = "UNDEFINED",
  TRAINER = "TRAINER"
}
@Component({
  selector: 'app-left-sidebar',  
  imports: [RouterModule, CommonModule],
  templateUrl: './left-sidebar.html',
  styleUrl: './left-sidebar.css'
})

export class LeftSidebar implements OnInit{
   @Input() isLeftSidebarCollapsed!: boolean;
  changeIsLeftSidebarCollapsed = output<boolean>();
  logoText:string ='';
  currentUser:UserRole = UserRole.UNDEFINED;
  items = [
    {
      routeLink:'dashboard',
      icon:'fa fa-home',
      label:'Dashboard',
      roles:[UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.UNITHEAD]
    },
     {
      routeLink: 'Edit-Units',
      icon: 'fa fa-cubes',
      label: 'Units',
      roles:[UserRole.ADMIN]
    },
  {
      routeLink: 'Edit-Trainers',
      icon: 'fa fa-users',
      label: 'Unit heads',
      roles:[UserRole.ADMIN]
    },
     {
      routeLink: 'staff',
      icon: 'fa fa-users',
      label: 'Staff',
      roles:[UserRole.UNITHEAD]
    },

    {
      routeLink: 'records',
      icon: 'fa fa-file-alt', // or any icon you prefer
      label: 'Records',
      roles:[UserRole.ADMIN, UserRole.UNITHEAD]
    },
    {
      routeLink: 'signout',
      icon: 'bi bi-box-arrow-right',
      label: 'Sign Out',
      roles:[UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.UNITHEAD]
    },
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
    this.changeIsLeftSidebarCollapsed.emit(!this.isLeftSidebarCollapsed);
  }

  closeSidenav(): void {
    this.changeIsLeftSidebarCollapsed.emit(true);
  }
  
  ngOnInit(): void {
    const Role = localStorage.getItem('role');
    console.log(Role);
   
if (
  Role !== null &&
  Object.values(UserRole).includes(Role as UserRole)
) {
  this.currentUser = Role as UserRole;
} else {
  this.currentUser = UserRole.UNDEFINED;
}
    this.items = this.items.filter(item => item.roles?.includes(this.currentUser));

    if(Role === UserRole.SUPERADMIN){
      this.logoText = 'Super Admin';
    }
    else if(Role === UserRole.ADMIN){
      this.logoText = 'Admin';
    }
    else if(Role === UserRole.UNITHEAD){
      this.logoText = 'Unit Head';
    }
  }
}
