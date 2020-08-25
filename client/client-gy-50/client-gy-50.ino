#include <Wire.h>
#include <L3G.h>
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>

#ifndef STASSID

#define STASSID "amb_machine_v1"
#define STAPSK  "ambmachineV1"
#endif

const char* ssid     = STASSID;
const char* password = STAPSK;

const char* host = "192.168.8.1";
const uint16_t port = 80;
char url[32];

const int ledPin =  LED_BUILTIN;
int ledState = LOW;

L3G gyro;

void setup() {
  Serial.begin(9600);
  sprintf(url, "http://%s:%d", host, port);

  pinMode(ledPin, OUTPUT);

  Serial.println();
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    if (ledState == LOW) {
      ledState = HIGH;
    } else {
      ledState = LOW;
    }

    digitalWrite(ledPin, ledState);

    delay(500);
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());


  digitalWrite(ledPin, HIGH);

  Wire.begin();

  if (!gyro.init())
  {
    Serial.println("Failed to autodetect gyro type!");
    digitalWrite(ledPin, LOW);
    while (1);
  }

  gyro.enableDefault();
}

void loop() {
  WiFiClient client;
  HTTPClient http;

  gyro.read();
  int x = (int)gyro.g.x;
  int y = (int)gyro.g.y;
  int z = (int)gyro.g.z;


  char params[64];
  sprintf(params, "x=%d&y=%d&z=%d", x,y, z);
  bool ok = false;

  Serial.print("[HTTP] begin...\n");

  if (http.begin(client, url)) {
      http.addHeader("Content-Type", "application/x-www-form-urlencoded");

      int httpCode = http.POST(params);
      ok = httpCode == 200;
      http.end();
  }

  if (ok) {
    ledState = HIGH;
    digitalWrite(ledPin, ledState);
  } else {
    if (ledState == LOW) {
      ledState = HIGH;
    } else {
      ledState = LOW;
    }

    digitalWrite(ledPin, ledState);
  }
}
