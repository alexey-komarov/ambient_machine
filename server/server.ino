#include <MIDI.h>
#include <ESP8266WiFi.h>
#include <WiFiClient.h>
#include <ESP8266WebServer.h>
#include <ESP8266mDNS.h>

#define NOTES_TOTAL 36
#define NOTES_HALF NOTES_TOTAL >> 1

MIDI_CREATE_DEFAULT_INSTANCE();

const char *ssid = "amb_machine_v1";
const char *password = "ambmachineV1";
const uint16_t port = 80;

const unsigned int MIDI_CHAN = 2;
const unsigned int TEMPO_MS = 1000;

ESP8266WebServer server(port);

const unsigned int durations[8] = {20, 40, 70, 120, 200, 300, 500, 800};
const unsigned int velocities[8] = {100, 104, 108, 112, 116, 120, 124, 127};

const unsigned int NOTES[NOTES_TOTAL] = {
	// G1  D2  F2  G2  A#2 C3  D3  F3  G3
	   31, 38, 41, 43, 46, 48, 50, 53, 55,
	// G2  D3  F3  G3  A#3 C4  D4  F4  G4
	   43, 50, 53, 55, 58, 60, 62, 65, 67,
	// G3  D4  F4  G4  A#4 C5  D5  F5  G5
	   55, 62, 65, 67, 70, 72, 74, 77, 79,
	// G4  D5  F5  G5  A#5 C6  D6  F6  G6
	   67, 74, 77, 79, 82, 84, 86, 89, 91
};

long getLongParam(String val) {
	return val == "" ? 0 : atol(val.c_str());
}

int normalize(long val) {
	int res = 0;

	if (val > 0) {
		res = sqrt(val);
		return min(res, 180);
	}

	if (val < 0) {
		res = sqrt(val * -1);
		return min(res, 180) * -1;
	}

	return 0;
}

unsigned int get_note(int val) {
	val = val / 10 + NOTES_HALF;
	return NOTES[min(val, 35)];
}

int last_z[8] = {0, 0, 0, 0, 0, 0, 0, 0};
int count = 0;

void handleRoot() {
	int x = normalize(getLongParam(server.arg("x")));
	int y = normalize(getLongParam(server.arg("y")));
	int z = normalize(getLongParam(server.arg("z")));

	// Transform to MIDI CC value [0..127]
	int xx = (abs(x) << 7) / 360;
	int yy = (abs(y) << 7) / 360;
	int zz = (abs(z) << 7) / 360;

	x = (x << 6) / 360 + 64;
	y = (y << 6) / 360 + 64;
	z = (z << 6) / 360 + 64;

	// Transform to MIDI notes
	int note_x = get_note(x);
	int note_y = get_note(y);
	int note_z = get_note(z);

	for (int i = 7; i >= 0; i--) {
		last[i] = last[i + 1];
	}

	last_z[8] = note_z;

	if (count++ == 8) {
		count = 0;
	}

	int idx = (127 - max(zz, 127)) >> 4;
	int duration = durations[idx];
	int velocity = velocities[idx];

	MIDI.sendControlChange(1, x, MIDI_CHAN);
	MIDI.sendControlChange(2, y, MIDI_CHAN);
	MIDI.sendControlChange(3, z, MIDI_CHAN);
	MIDI.sendControlChange(4, xx, MIDI_CHAN);
	MIDI.sendControlChange(5, yy, MIDI_CHAN);
	MIDI.sendControlChange(6, zz, MIDI_CHAN);

	MIDI.sendNoteOn(note_x, velocity, MIDI_CHAN);
	MIDI.sendNoteOn(note_y, velocity, MIDI_CHAN + 1);
	MIDI.sendNoteOn(note_z, velocity, MIDI_CHAN + 2);

	if (last_z[0] != 0) {
		MIDI.sendNoteOn(note_z, velocity, MIDI_CHAN + 3);
	}

	delay(duration);

	MIDI.sendNoteOff(note_x, velocity, MIDI_CHAN);
	MIDI.sendNoteOff(note_y, velocity, MIDI_CHAN + 1);
	MIDI.sendNoteOff(note_z, velocity, MIDI_CHAN + 2);

	if (last_z[0] != 0) {
		MIDI.sendNoteOff(note_z, velocity, MIDI_CHAN + 3);
	}

	delay(TEMPO_MS - duration);

	server.send(200, "");
}

void setup() {
	Serial.begin(9600);

	WiFi.mode(WIFI_AP);

	while (!(WiFi.softAPConfig(IPAddress(192, 168, 8, 1),
		IPAddress(192, 168, 8, 1), IPAddress(255, 255, 255, 0))));

	while (!(WiFi.softAP(ssid)));

	WiFi.softAP(ssid, password, 4, false, 8);

	IPAddress myIP = WiFi.softAPIP();
	MIDI.begin(MIDI_CHAN);

	server.on("/", HTTP_POST, handleRoot);
	server.begin();
}

void loop() {
	server.handleClient();
}
