#include <Wire.h>
#include <L3G.h>
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>

const char *ssid = "amb_machine_v1";
const char *password = "ambmachineV1";
const char *url = "http://192.168.43.77:9000/";
const int LEDPIN_1 = 16;

#define SDA 14
#define SCL 12

L3G gyro;

int ledState = HIGH;

void switch_led() {
	if (ledState == LOW) {
		ledState = HIGH;
	} else {
		ledState = LOW;
	}
}

void setup() {
	Serial.begin(9600);
	Serial.println("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!1");
	pinMode(LEDPIN_1, OUTPUT);

	WiFi.mode(WIFI_STA);
	WiFi.begin(ssid, password);

	while (WiFi.status() != WL_CONNECTED) {
		Serial.println("Waiting for wifi");
		switch_led();
		delay(1000);
		digitalWrite(LEDPIN_1, ledState);
	}

	Serial.println("Starting wire");
	Wire.begin(SDA, SCL);

	digitalWrite(LEDPIN_1, LOW);

	if (!gyro.init()) {
		digitalWrite(LEDPIN_1, LOW);
		Serial.println("Failed to init gyro");

		while (1) {
			for (int i = 0; i <3; i++) {
				digitalWrite(LEDPIN_1, HIGH);
				delay(200);
				digitalWrite(LEDPIN_1, LOW);
				delay(100);
			}

			delay(500);
		}
	}

	digitalWrite(LEDPIN_1, LOW);
	gyro.enableDefault();
}

int errors = 0;

void loop() {
	if(WiFi.status() == WL_CONNECTED) {
		if (ledState == HIGH && errors == 0) {
			switch_led();
			digitalWrite(LEDPIN_1, ledState);
		}
	} else {
		switch_led();
		delay(300);
		digitalWrite(LEDPIN_1, ledState);
		return;
	}

	gyro.read();

	WiFiClient client;
	HTTPClient http;

	gyro.read();
	int x = (int)gyro.g.x;
	int y = (int)gyro.g.y;
	int z = (int)gyro.g.z;

	char params[64];
	sprintf(params, "id=2&gx=%d&gy=%d&gz=%d", x, y, z);

	if (http.begin(url)) {
		http.addHeader("Content-Type", "application/x-www-form-urlencoded");
		int code = http.POST(params);

		Serial.println(code);

		if (code == 200) {
			if (errors > 0) {
				digitalWrite(LEDPIN_1, LOW);
				errors = 0;
			}
		} else if (errors++ == 0) {
			digitalWrite(LEDPIN_1, HIGH);
		}

		http.end();
	} else if (errors++ == 0) {
		digitalWrite(LEDPIN_1, HIGH);
	}
}
