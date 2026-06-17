import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/guest/event-types-page').then((m) => m.EventTypesPage),
    title: 'Запись на встречу',
  },
  {
    path: 'book/:eventTypeId',
    loadComponent: () =>
      import('./pages/guest/booking-page').then((m) => m.BookingPage),
    title: 'Бронирование',
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./pages/admin/admin-layout').then((m) => m.AdminLayout),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'bookings' },
      {
        path: 'bookings',
        loadComponent: () =>
          import('./pages/admin/admin-bookings-page').then((m) => m.AdminBookingsPage),
        title: 'Встречи — админка',
      },
      {
        path: 'bookings/:bookingId',
        loadComponent: () =>
          import('./pages/admin/admin-booking-detail-page').then(
            (m) => m.AdminBookingDetailPage,
          ),
        title: 'Встреча — админка',
      },
      {
        path: 'event-types',
        loadComponent: () =>
          import('./pages/admin/admin-event-types-page').then(
            (m) => m.AdminEventTypesPage,
          ),
        title: 'Типы событий — админка',
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
