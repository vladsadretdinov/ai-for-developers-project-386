import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen flex flex-col bg-muted/30">
      <header class="border-b bg-background">
        <div class="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <a routerLink="/" class="flex items-center gap-2 font-semibold">
            <span
              class="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm"
              >B</span
            >
            Booking Calendar
          </a>
          <nav class="flex items-center gap-1 text-sm">
            <a
              routerLink="/"
              routerLinkActive="bg-accent text-accent-foreground"
              [routerLinkActiveOptions]="{ exact: true }"
              class="rounded-md px-3 py-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >Запись</a
            >
            <a
              routerLink="/admin"
              routerLinkActive="bg-accent text-accent-foreground"
              class="rounded-md px-3 py-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >Админка</a
            >
          </nav>
        </div>
      </header>
      <main class="flex-1">
        <router-outlet />
      </main>
      <footer class="border-t bg-background py-4 text-center text-xs text-muted-foreground">
        Booking Calendar — UI следует контракту OpenAPI
      </footer>
    </div>
  `,
})
export class App {}
