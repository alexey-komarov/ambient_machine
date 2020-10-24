#include <Wire.h>
#include <L3G.h>
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>

const char *ssid = "amb_machine_v1";
const char *password = "ambmachineV1";
const char *url = "http://192.168.43.77:9000/";

const int ledPin = LED_BUILTIN;
int ledState = LOW;

L3G gyro;

void setup() {
	pinMode(ledPin, OUTPUT);

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

	Wire.begin();

	if (!gyro.init()) {
		digitalWrite(ledPin, LOW);
		while (1);
	}

	digitalWrite(ledPin, HIGH);
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
	sprintf(params, "id=7&gx=%d&gy=%d&gz=%d", x, y, z);
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
