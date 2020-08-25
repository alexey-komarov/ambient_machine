#include <MIDI.h>
#include <ESP8266WiFi.h>
#include <WiFiClient.h>
#include <ESP8266WebServer.h>
#include <ESP8266mDNS.h>

MIDI_CREATE_DEFAULT_INSTANCE();

const char *ssid = "amb_machine_v1";  
const char *password = "ambmachineV1";
const unsigned int CHAN = 2; // midi channel

const unsigned int VELOCITY = 127;
const unsigned int PLAY_TIME = 100; // ms

ESP8266WebServer server(80);

const unsigned int lengths[9] = {16, 20, 40, 50, 100, 200, 300, 500, 800};

const unsigned int NOTES[36] = {
  // G1  D2  F2  G2  A#2 C3  D3  F3  G3
     31, 38, 41, 43, 46, 48, 50, 53, 55,
  // G2  D3  F3  G3  A#3 C4  D4  F4  G4
     43, 50, 53, 55, 58, 60, 62, 65, 67,
  // G3  D4  F4  G4  A#4 C5  D5  F5  G5
     55, 62, 65, 67, 70, 72, 74, 77, 79,
  // G4  D5  F5  G5  A#5 C6  D6  F6  G6
     67, 74, 77, 79, 82, 84, 86, 89, 91
};

void handleRoot() {
  String xs = server.arg("x");
  String ys = server.arg("y");
  String zs = server.arg("z");
  
  long x = xs == "" ? 0 : atol(xs.c_str());
  long y = ys == "" ? 0 : atol(ys.c_str());
  long z = zs == "" ? 0 : atol(zs.c_str());

  if (x > 0) {
    x = sqrt(x);
  }

  if (y > 0) {
    y = sqrt(y);
  }

  if (z > 0) {
    z = sqrt(z);
  }

  if (x < 0) {
    x = sqrt(x * -1) * -1;
  }
  
  if (y < 0) {
    y = sqrt(y * -1) * -1;
  }

  if (z < 0) {
    z = sqrt(z * -1) * -1;
  }

  long xx = x;

  if (x < 0) {
    xx *= -1;
  }

  long yy = y;

  if (y < 0) {
    yy *= -1;
  }

  long zz = z;

  if (z < 0) {
    zz *= -1;
  }

  int note_x = x * 18 / 200 + 18;
  int note_y = y * 18 / 200 + 18;
  int note_z = z * 18 / 200 + 18;

  x = x * 64 / 200 + 64;
  y = y * 64 / 200 + 64;
  z = z * 64 / 200 + 64;

  xx = xx * 128 / 320;
  yy = yy * 128 / 320;
  zz = zz * 128 / 320;


  if (note_x > 26) {
    note_x=26;
  }
  if (note_y > 26) {
    note_y=26;
  }

  if (note_z > 26) {
    note_z=26;
  }

  int t1 = zz;

  if (t1 > 128) {
    t1 = 127;
  }

  t1 = 128 - t1;
  t1 = t1 >> 4;
  t1 = lengths[t1];

  note_x = NOTES[35 - note_x];
  note_y = NOTES[35 - note_y];
  note_z = NOTES[35 - note_z];

  MIDI.sendControlChange(1, x, CHAN);
  MIDI.sendControlChange(2, y, CHAN);
  MIDI.sendControlChange(3, z, CHAN);
  MIDI.sendControlChange(4, xx, CHAN);
  MIDI.sendControlChange(5, yy, CHAN);
  MIDI.sendControlChange(6, zz, CHAN);

  MIDI.sendNoteOn(note_x, VELOCITY, CHAN);
  MIDI.sendNoteOn(note_y, VELOCITY, CHAN + 1);
  MIDI.sendNoteOn(note_z, VELOCITY, CHAN + 2);
  
  delay(t1);
  MIDI.sendNoteOff(note_x, VELOCITY, CHAN); 
  MIDI.sendNoteOff(note_y, VELOCITY, CHAN + 1); 
  MIDI.sendNoteOff(note_z, VELOCITY, CHAN + 2); 

  delay(1000 - t1);

  server.send(200, "");
}

void setup() {
  Serial.begin(9600);

  WiFi.mode(WIFI_AP);
  while (!(WiFi.softAPConfig(IPAddress(192, 168, 8, 1) , IPAddress(192, 168, 8, 1) , IPAddress(255, 255, 255, 0) )));
  while (!(WiFi.softAP(ssid)));
  WiFi.softAP(ssid, password, 4, false, 8); 

  IPAddress myIP = WiFi.softAPIP();

  server.on("/", HTTP_POST, handleRoot);
  server.begin();
  MIDI.begin(CHAN);
}

void loop() {
  server.handleClient();
}
