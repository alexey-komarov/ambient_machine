#include "GY_85.h"
#include <Wire.h>

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>

GY_85 GY85;

const char *ssid = "amb_machine_v1";
const char *password = "ambmachineV1";
const char *url = "http://192.168.43.77:9000/";

const int ledPin = LED_BUILTIN;
int ledState = LOW;

void setup() {
  pinMode(ledPin, OUTPUT);
  Serial.begin(9000);

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

  Serial.println("WIFI OK");
  Wire.begin();
  delay(10);

  GY85.init();
  digitalWrite(ledPin, HIGH);
}

void loop() {
  WiFiClient client;
  HTTPClient http;

  int ax = GY85.accelerometer_x( GY85.readFromAccelerometer() );
  int ay = GY85.accelerometer_y( GY85.readFromAccelerometer() );
  int az = GY85.accelerometer_z( GY85.readFromAccelerometer() );

  int cx = GY85.compass_x( GY85.readFromCompass() );
  int cy = GY85.compass_y( GY85.readFromCompass() );
  int cz = GY85.compass_z( GY85.readFromCompass() );

  float gx = GY85.gyro_x( GY85.readGyro() );
  float gy = GY85.gyro_y( GY85.readGyro() );
  float gz = GY85.gyro_z( GY85.readGyro() );
  float gt = GY85.temp  ( GY85.readGyro() );

  char params[256];
  sprintf(params, "id=5&gx=%.2f&gy=%.2f&gz=%.2f&ax=%d&ay=%d&az=%d&cx=%d&cy=%d&cz=%d&gt=%.2f", gx, gy, gz, ax, ay, az, cx, cy, cz, gt);
  bool ok = false;

  if (http.begin(client, url)) {
    http.addHeader("Content-Type", "application/x-www-form-urlencoded");
    ok = http.POST(params) == 200;
    http.end();
  }

  if (ok || ledState == LOW) {
    ledState = HIGH;
  } else {
    ledState = LOW;
  }

  digitalWrite(ledPin, ledState);
}
