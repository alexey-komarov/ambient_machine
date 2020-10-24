#include <math.h>
#include <Wire.h>
#include <L3G.h>
#include <WiFi.h>
#include <HTTPClient.h>
 
L3G gyro;

#define SDA_1 17
#define SCL_1 18

#define LEDPIN_1 16

const int x_out = A6;
const int y_out = A3;
const int z_out = A0;

const char *ssid = "amb_machine_v1";
const char *password = "ambmachineV1";
const char *url = "http://192.168.43.77:9000/";

TwoWire I2C0 = TwoWire(0);
int ledState = HIGH;

void switch_led() {
	if (ledState == LOW) {
		ledState = HIGH;
	} else {
		ledState = LOW;
	}
}

static void configureWiFi() {
	WiFi.persistent(false);
	WiFi.disconnect(true);
	WiFi.mode(WIFI_OFF);
	WiFi.mode(WIFI_STA);

	WiFi.onEvent([](WiFiEvent_t event, WiFiEventInfo_t info) {
		WiFi.persistent(false);
		WiFi.disconnect(true);
		ESP.restart();
	}, WiFiEvent_t::SYSTEM_EVENT_STA_DISCONNECTED);
}

void setup() {
	Serial.begin(9600);
	Serial.println("Started");

	pinMode(LEDPIN_1, OUTPUT);

	configureWiFi();
	WiFi.begin(ssid, password);

	while (WiFi.status() != WL_CONNECTED) {
		switch_led();
		delay(1000);
		digitalWrite(LEDPIN_1, ledState);
	}

	I2C0.begin(SDA_1, SCL_1, 100000);

	digitalWrite(LEDPIN_1, LOW);

	if (!gyro.init(&I2C0)) {
		digitalWrite(LEDPIN_1, LOW);

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

	HTTPClient http;

	int gx = (int)gyro.g.x;
	int gy = (int)gyro.g.y;
	int gz = (int)gyro.g.z;

	int ax = analogRead(x_out);
	int ay = analogRead(y_out);
	int az = analogRead(z_out);

	char params[64];
	sprintf(params, "id=1&gx=%d&gy=%d&gz=%d&ax=%d&ay=%d&az=%d", gx, gy, gz, ax, ay, ax);

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
