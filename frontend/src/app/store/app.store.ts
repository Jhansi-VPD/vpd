class AppStore {
  private sidebarOpen: boolean = true;

  isSidebarOpen(): boolean {
    return this.sidebarOpen;
  }

  toggleSidebar(): boolean {
    this.sidebarOpen = !this.sidebarOpen;
    return this.sidebarOpen;
  }
}

export const appStore = new AppStore();
export default appStore;

