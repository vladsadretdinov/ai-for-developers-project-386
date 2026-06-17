import type { components } from './schema';

/** Domain models derived directly from the OpenAPI contract. */
export type Owner = components['schemas']['Owner'];
export type EventType = components['schemas']['EventType'];
export type EventTypeCreate = components['schemas']['EventTypeCreate'];
export type Slot = components['schemas']['Slot'];
export type SlotList = components['schemas']['SlotList'];
export type Booking = components['schemas']['Booking'];
export type BookingCreate = components['schemas']['BookingCreate'];
export type BookingStatus = components['schemas']['BookingStatus'];

export type ApiError = components['schemas']['ApiError'];
export type NotFoundError = components['schemas']['NotFoundError'];
export type ValidationError = components['schemas']['ValidationError'];
export type SlotTakenError = components['schemas']['SlotTakenError'];
