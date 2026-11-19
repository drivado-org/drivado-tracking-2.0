# SSE event payloads

GET /trips/{tripID}/stream

## snapshot

```json
{
  "bookingID": "B123",
  "driverID": "D123",
  "driverStatus": "ENROUTE",
  "tripID": "T0192f0e2a1b27c3d8e4f5a6b7c8d9e0f",
  "tripType": "TRIP_S"
}
```

```json
{
  "bookingID": "B123",
  "driverID": "D123",
  "driverStatus": "ENROUTE",
  "tripID": "T0192f0e2a1b27c3d8e4f5a6b7c8d9e0f",
  "tripType": "TRIP_S",
  "location": {
    "lat": 22.5726,
    "lng": 88.3639,
    "timestamp": "2026-11-16T10:30:00Z"
  }
}
```

```json
{
  "bookingID": "B123",
  "driverID": "D123",
  "driverStatus": "POB",
  "tripID": "T0192f0e2a1b27c3d8e4f5a6b7c8d9e0f",
  "tripType": "TRIP_S",
  "eta": 420,
  "distance": 1234.5,
  "location": {
    "lat": 22.5726,
    "lng": 88.3639,
    "timestamp": "2026-11-16T10:30:00Z"
  },
  "route": [
    { "lat": 22.5726, "lng": 88.3639 },
    { "lat": 22.6, "lng": 88.4 }
  ],
  "bearing": 90
}
```

```json
{
  "bookingID": "B123",
  "driverID": "D123",
  "driverStatus": "COMPLETED",
  "tripID": "T0192f0e2a1b27c3d8e4f5a6b7c8d9e0f",
  "tripType": "TRIP_S",
  "eta": 0,
  "distance": 0,
  "location": { "lat": 22.6, "lng": 88.4, "timestamp": "2026-11-16T10:45:00Z" },
  "route": [
    { "lat": 22.5726, "lng": 88.3639 },
    { "lat": 22.6, "lng": 88.4 }
  ],
  "bearing": 0
}
```

```
## location
```

```json
{ "lat": 22.5726, "lng": 88.3639, "timestamp": "2026-11-16T10:30:00Z" }
```

```json
{ "lat": 22.5731, "lng": 88.3645, "timestamp": "2026-11-16T10:30:05.250Z" }
```

```

## eta
```

```json
{ "eta": 420, "distance": 1234.5 }
```

```json
{ "eta": 60, "distance": 180 }
```

```json
{ "eta": 0, "distance": 0 }
```

```

## route_change
```

```json
{
  "route": [
    { "lat": 22.5726, "lng": 88.3639 },
    { "lat": 22.6, "lng": 88.4 }
  ]
}
```

```json
{
  "route": [
    { "lat": 22.5726, "lng": 88.3639 },
    { "lat": 22.581, "lng": 88.372 },
    { "lat": 22.59, "lng": 88.385 },
    { "lat": 22.6, "lng": 88.4 }
  ]
}
```

```

## vehicle_meta
```

```json
{ "reroute": false, "bearing": 90 }
```

```json
{ "reroute": true, "bearing": 270 }
```

```json
{ "reroute": false, "bearing": 0 }
```

```json
{ "reroute": false }
```

```json
{ "reroute": true }
```

```

## driver_status
```

```json
{ "driverStatus": "ENROUTE" }
```

```json
{ "driverStatus": "ARRIVED" }
```

```json
{ "driverStatus": "POB" }
```

```json
{ "driverStatus": "COMPLETED" }
```

```

## notification
```

```json
{ "message": "Your driver is 2 minutes away" }
```

```json
{ "message": "Your driver has arrived" }
```

```

```
