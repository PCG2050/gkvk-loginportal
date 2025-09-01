import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, OnInit } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import '@angular/compiler';
import { UserRole } from '../../../core/models/userRoles.model';

@Component({
  selector: 'app-main',
  imports: [RouterOutlet,CommonModule, RouterModule],
  templateUrl: './main.html',
  styleUrl: './main.css'
})
export class Main implements OnInit{
  isLeftSidebarCollapsed = input.required<boolean>();
   screenwidth = input.required<number>();
   
   sizeClass = computed(() => {
    const isLeftSidebarCollapsed = this.isLeftSidebarCollapsed();
    if(isLeftSidebarCollapsed) {
      return '';
    }
    return this.screenwidth() > 768 ? 'body-trimmed' : 'body-md-screen';
    
   });
   ngOnInit(): void {
    
   }
}
