# Circa — Smart Farming Dashboard

Real-time field monitoring and irrigation control for ESP32-based turret systems.

## Architecture

```
ESP32 Base Stations / Nodes
        │ ESP-NOW → Base Station
        │ HTTP API (192.168.4.1)
        ▼
React Frontend (port 5173)
  └─ Direct HTTP calls to ESP32
  └─ localStorage for state persistence
  └─ Mosquitto MQTT (optional, for multi-station deployments)
```

## Quick Start

### 1. Start the MQTT Broker (optional)

Only needed for multi-station setups where sensors report over WiFi/MQTT.

```bash
docker compose up -d
```

> Requires Docker Desktop. Mosquitto will run on port 1883 (MQTT) and 9001 (WebSocket).

### 2. Configure Environment Variables

```bash
cp client/.env.example client/.env
# Fill in: VITE_OPENROUTER_API_KEY (for AI assistant)
#          VITE_ELEVENLABS_API_KEY (for voice output)
#          VITE_ELEVENLABS_VOICE_ID (optional, defaults to a preset voice)
```

### 3. Start the Frontend

```bash
cd client
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

> The app runs fully in the browser. Connect to the `Turret-ESP32` Wi-Fi hotspot to control hardware directly.

---

## Firmware Setup (ESP32)

### Required Libraries (Arduino Library Manager)

- **PubSubClient** by Nick O'Leary
- **DHT sensor library** by Adafruit
- **Adafruit Unified Sensor**
- **ESP32Servo**
- **ArduinoJson**

### Flash the Turret Station

1. Open `firmware/turret_station/` in PlatformIO (or use Arduino IDE with `base_station/base_station.ino`)
2. Edit `firmware/config.h`:
   - Set `WIFI_SSID`, `WIFI_PASSWORD`
   - Set `DEVICE_ID` to e.g. `"station-001"`
   - Verify pin assignments match your wiring
3. Select **ESP32 Dev Module** and flash

The turret station runs as a Wi-Fi SoftAP (`Turret-ESP32`, IP `192.168.4.1`) and serves an HTTP API on port 80.

### Flash a Sensor Node

1. Open `firmware/node/` in PlatformIO
2. Edit `config.h` with a unique `DEVICE_ID` (e.g. `"node-001"`)
3. Flash — nodes use ESP-NOW to report moisture data to the base station

### Wire the Base Station

| Component | ESP32 Pin |
|-----------|-----------|
| DHT22 data | GPIO 4 |
| Soil sensor (analog) | GPIO 34 |
| Servo signal | GPIO 18 |
| Pump relay | GPIO 19 |

---

## Pairing a Device

1. In the dashboard, go to **Configure** → **Add Device**
2. Enter the same `DEVICE_ID` you set in `config.h`
3. Enter the physical field coordinates (0–1 normalized) or click on the field map
4. Power on the ESP32 — it will appear online in the field view

---

## MQTT Topic Reference

| Topic | Direction | Description |
|-------|-----------|-------------|
| `circa/station/{id}/humidity` | ESP32 → Server | % relative humidity |
| `circa/station/{id}/temperature` | ESP32 → Server | °C |
| `circa/station/{id}/soil_moisture` | ESP32 → Server | % moisture |
| `circa/node/{id}/soil_moisture` | ESP32 → Server | % moisture |
| `circa/node/{id}/status` | ESP32 → Server | 1=online |
| `circa/control/{id}/turret` | Server → ESP32 | `{"action":"fire","angle":90,"duration":5000}` |
| `circa/control/{id}/pump` | Server → ESP32 | `{"action":"on"\|"off"}` |

---

## Testing without Hardware

Use `mosquitto_pub` to simulate sensor readings:

```bash
# Simulate temperature reading
mosquitto_pub -h localhost -t "circa/station/station-001/temperature" -m '{"value":24.5}'

# Simulate soil moisture
mosquitto_pub -h localhost -t "circa/node/node-001/soil_moisture" -m '{"value":35.0}'
```

The frontend also has a built-in simulated data mode for demo/offline use — set `IS_STATIC_DEPLOYMENT = true` in `client/src/lib/runtimeConfig.ts`.
