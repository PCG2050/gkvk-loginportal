import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-main',
  imports: [RouterOutlet,CommonModule],
  templateUrl: './main.html',
  styleUrl: './main.css'
})
export class Main {
  isLeftSidebarCollapsed = input.required<boolean>();
   screenwidth = input.required<number>();
   sizeClass = computed(() => {
    const isLeftSidebarCollapsed = this.isLeftSidebarCollapsed();
    if(isLeftSidebarCollapsed) {
      return '';
    }
    return this.screenwidth() > 768 ? 'body-trimmed' : 'body-md-screen';
    
   });
}
