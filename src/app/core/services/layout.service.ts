import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  private isLeftSidebarCollapsed = signal<boolean>(false);
  private sidebarStateBeforeModal = signal<boolean>(false);

  constructor() {
    // Initialize based on screen size
    this.isLeftSidebarCollapsed.set(window.innerWidth < 768);
  }

  /**
   * Get current sidebar collapsed state
   */
  getIsLeftSidebarCollapsed() {
    return this.isLeftSidebarCollapsed();
  }

  /**
   * Get sidebar collapsed signal (reactive)
   */
  getIsLeftSidebarCollapsedSignal() {
    return this.isLeftSidebarCollapsed;
  }

  /**
   * Set sidebar collapsed state
   */
  setIsLeftSidebarCollapsed(value: boolean) {
    this.isLeftSidebarCollapsed.set(value);
  }

  /**
   * Toggle sidebar collapsed state
   */
  toggleSidebar() {
    this.isLeftSidebarCollapsed.set(!this.isLeftSidebarCollapsed());
  }

  /**
   * Collapse sidebar and save previous state (for modal open)
   */
  collapseSidebarForModal() {
    this.sidebarStateBeforeModal.set(this.isLeftSidebarCollapsed());
    this.isLeftSidebarCollapsed.set(true);
  }

  /**
   * Restore sidebar to state before modal opened
   */
  restoreSidebarAfterModal() {
    this.isLeftSidebarCollapsed.set(this.sidebarStateBeforeModal());
  }
}
