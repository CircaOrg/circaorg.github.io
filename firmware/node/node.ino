// ─────────────────────────────────────────────────────────────────────────────
// Circa Sensor Node — ESP-NOW firmware
//
// Communication: ESP-NOW broadcast → Base Station
// Sensors:
//   GPIO 18 = DO  (digital threshold; LOW = wet, HIGH = dry)
//   GPIO 34 = AO  (analog moisture reading)
//     ⚠ NOTE: Move AO wire from D19 → D34. GPIO19 is not ADC-capable on ESP32.
//
// Behaviour: wake → read → send → deep-sleep (SLEEP_SECONDS)
// No WiFi connection is made; ESP-NOW transmits on the same channel as the
// base station SoftAP (channel 1 by default).
// ─────────────────────────────────────────────────────────────────────────────

#include <Arduino.h>
#include <WiFi.h>
#include <esp_now.h>
#include <esp_wifi.h>

// ── Node identity ─────────────────────────────────────────────────────────────
// Change this unique string for every node you flash.
#define NODE_ID  "node-001"

// ── Sensor pins ───────────────────────────────────────────────────────────────
#define SOIL_DO_PIN  18    // Digital threshold (HIGH = dry, LOW = wet)
#define SOIL_AO_PIN  34    // Analog reading  ← move wire here from D19

// ── Calibration ───────────────────────────────────────────────────────────────
// Read raw ADC in open air (dry) and submerged (wet) for your specific sensor.
#define SOIL_DRY_RAW  3200
#define SOIL_WET_RAW  1500

// ── Timing ────────────────────────────────────────────────────────────────────
#define SLEEP_SECONDS  30   // seconds between readings

// ── WiFi channel — must match the base station SoftAP channel (default 1) ─────
#define WIFI_CHANNEL  1

// ─────────────────────────────────────────────────────────────────────────────
// Packet — must match NodePacket in base station main.cpp exactly
// ─────────────────────────────────────────────────────────────────────────────
typedef struct __attribute__((packed)) {
  char  id[16];     // NODE_ID string
  float soil_pct;   // 0–100 %
  bool  soil_wet;   // true  = DO pin LOW (wet threshold crossed)
} NodePacket;

// ── Send state ────────────────────────────────────────────────────────────────
static volatile bool sendDone = false;
static volatile bool sendOK   = false;

// ── Broadcast address — base receives from any sender, no MAC hard-coding ─────
static uint8_t BROADCAST[6] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};

// ─────────────────────────────────────────────────────────────────────────────
// Sensor helpers
// ─────────────────────────────────────────────────────────────────────────────

float readSoilPct() {
  int raw = analogRead(SOIL_AO_PIN);
  // Higher raw value = drier on most capacitive/resistive modules
  float pct = (float)(SOIL_DRY_RAW - raw) / (float)(SOIL_DRY_RAW - SOIL_WET_RAW) * 100.0f;
  return constrain(pct, 0.0f, 100.0f);
}

// ─────────────────────────────────────────────────────────────────────────────
// ESP-NOW send callback
// ─────────────────────────────────────────────────────────────────────────────

void IRAM_ATTR onSendDone(const uint8_t *mac, esp_now_send_status_t status) {
  sendOK   = (status == ESP_NOW_SEND_SUCCESS);
  sendDone = true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Setup — runs once per wake cycle, then deep-sleeps
// ─────────────────────────────────────────────────────────────────────────────

void setup() {
  Serial.begin(115200);
  delay(100);
  Serial.printf("\n[Node %s] Wake\n", NODE_ID);

  // Sensor pins
  pinMode(SOIL_DO_PIN, INPUT);
  // SOIL_AO_PIN is analogue; no pinMode needed

  // WiFi in station mode (no AP connection) on the correct channel
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  esp_wifi_set_channel(WIFI_CHANNEL, WIFI_SECOND_CHAN_NONE);

  // Init ESP-NOW
  if (esp_now_init() != ESP_OK) {
    Serial.println("[ESP-NOW] Init failed — sleeping anyway");
    esp_deep_sleep(SLEEP_SECONDS * 1000000ULL);
    return;
  }
  esp_now_register_send_cb(onSendDone);

  // Add broadcast peer
  esp_now_peer_info_t peer = {};
  memcpy(peer.peer_addr, BROADCAST, 6);
  peer.channel = WIFI_CHANNEL;
  peer.encrypt = false;
  esp_now_add_peer(&peer);

  // Read sensors
  NodePacket pkt = {};
  strlcpy(pkt.id, NODE_ID, sizeof(pkt.id));
  pkt.soil_pct = readSoilPct();
  pkt.soil_wet = (digitalRead(SOIL_DO_PIN) == LOW);

  Serial.printf("[Node %s] soil=%.1f%%  wet=%s\n",
                NODE_ID, pkt.soil_pct, pkt.soil_wet ? "YES" : "NO");

  // Send
  esp_now_send(BROADCAST, (const uint8_t *)&pkt, sizeof(pkt));

  // Wait for send callback (max 500 ms)
  uint32_t t0 = millis();
  while (!sendDone && millis() - t0 < 500) delay(5);

  Serial.printf("[Node %s] Send %s — sleeping %ds\n",
                NODE_ID, sendOK ? "OK" : "FAIL", SLEEP_SECONDS);
  delay(30);  // let serial flush before sleep

  esp_deep_sleep(SLEEP_SECONDS * 1000000ULL);
}

void loop() {
  // Never reached — deep-sleep fires at end of setup()
}
