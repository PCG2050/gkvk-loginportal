import { Component,HostListener,OnInit,signal } from '@angular/core';
import { RouterOutlet,RouterLink } from '@angular/router';
import { LeftSidebar } from './left-sidebar/left-sidebar';
import { Main } from './main/main';
import { HeaderComponent } from './header/header.component';
import { LayoutService } from '../../core/services/layout.service';

@Component({
  selector: 'app-layout',
  imports: [LeftSidebar,Main, HeaderComponent],
  templateUrl: './layout.html',
  styleUrl: './layout.css'
})
export class Layout implements OnInit {
get isLeftSidebarCollapsed() {
  return this.layoutService.getIsLeftSidebarCollapsedSignal();
}
screenWidth = signal<number>(window.innerWidth);

  constructor(private layoutService: LayoutService) {}

  @HostListener('window:resize')
  onResize() {
    this.screenWidth.set(window.innerWidth);
    if(this.screenWidth() < 768) {
      this.layoutService.setIsLeftSidebarCollapsed(true);
    }
  }

  ngOnInit(): void {
    this.layoutService.setIsLeftSidebarCollapsed(this.screenWidth() < 768);
  }

 changeIsLeftSidebarCollapsed(isLeftSidebarCollapsed: boolean): void {
  this.layoutService.setIsLeftSidebarCollapsed(isLeftSidebarCollapsed);
}

}
