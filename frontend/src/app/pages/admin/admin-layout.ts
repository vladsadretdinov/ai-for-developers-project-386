import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="mx-auto max-w-6xl px-4 py-8">
      <div class="mb-6">
        <h1 class="text-2xl font-bold tracking-tight">Панель владельца</h1>
        <p class="text-sm text-muted-foreground">Управление типами событий и бронированиями.</p>
      </div>
      <nav class="mb-6 flex gap-1 border-b">
        <a
          routerLink="bookings"
          routerLinkActive="border-primary text-foreground"
          class="-mb-px border-b-2 border-transparent px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >Встречи</a
        >
        <a
          routerLink="event-types"
          routerLinkActive="border-primary text-foreground"
          class="-mb-px border-b-2 border-transparent px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >Типы событий</a
        >
      </nav>
      <router-outlet />
    </div>
  `,
})
export class AdminLayout {}
