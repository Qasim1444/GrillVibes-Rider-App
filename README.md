# GrillVibes Rider App

Expo React Native app for GrillVibes delivery riders.

## Features

- Rider login using Laravel Sanctum.
- Session restore from secure storage.
- Assigned delivery list from `/api/rider/orders`.
- Delivery detail with customer phone and WhatsApp shortcuts.
- Status flow guards:
  - `assigned` -> accept or reject
  - `accepted` -> picked up
  - `picked_up` -> on way
  - `on_way` -> delivered
- COD delivery confirmation with required cash collection.
- Optional proof image upload for delivery.
- Completed delivery history from `/api/rider/history`.

## Setup

Install dependencies:

```bash
npm install
```

Set the API URL in `app.json` under `expo.extra.apiBaseUrl`.

Start the app:

```bash
npm run start
```

For Android emulators, replace `http://127.0.0.1:8000/api` with `http://10.0.2.2:8000/api` if the Laravel backend is running on the host machine.
