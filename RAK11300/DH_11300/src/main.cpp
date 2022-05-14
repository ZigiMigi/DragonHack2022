#include <Arduino.h>
#include "LoRaWan-Arduino.h" //http://librarymanager/All#SX126x
#include <SPI.h>

#include <stdio.h>

#include "mbed.h"
#include "rtos.h"

#include <TinyGPS.h>

using namespace std::chrono_literals;
using namespace std::chrono;

TinyGPS gps;

// ************************************ IDs ************************************
#include "keys.h"
// ************************************     ************************************


void setup() {
  // put your setup code here, to run once:

  // //Setup LEDs
  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, LOW);

  // Initialize Serial for debug output
  time_t timeout = millis();
  Serial.begin(115200);
  while (!Serial)
  {
    if ((millis() - timeout) < 5000)
    {
      delay(100);
    }
    else
    {
      break;
    }
  }
}

int aliveCounter = 0;

void loop() {
  // put your main code here, to run repeatedly:
  if (aliveCounter++ % 100000 == 0)
  {
    Serial.print(aliveCounter / 100000);
    Serial.println("Alive");
  }
}