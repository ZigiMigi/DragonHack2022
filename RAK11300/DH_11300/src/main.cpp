#include <Arduino.h>
#include "LoRaWan-Arduino.h" //http://librarymanager/All#SX126x
#include <SPI.h>
#include <stdio.h>
#include "mbed.h"
#include "rtos.h"

#include <TinyGPS.h>
#define GPS
#define GPS_HARDCODE

using namespace std::chrono_literals;
using namespace std::chrono;

// Global variables
TinyGPS gps;
mbed::Ticker appTimer;
bool doSend = false;
bool rejoin = false;

// Forward Callback declerations
void GPS_CheckTrigger               (void);
bool sendLoRaFrame                  (void);
void LoRa_onHandlerJoined           (void);
void LoRa_onFailedHandlerJoin       (void);
void LoRa_onUncomfirmedSendFinished (void);
void LoRa_RejoinHandler             (void);
void LoRa_rxHandler                 (lmh_app_data_t *app_data);
void LoRa_onConfirmClassHandler     (DeviceClass_t Class);
void lorawan_conf_finished          (bool result);

// LoRa params
bool doOTAA = true;                                           // Over the air activation
#define LORAWAN_DATERATE DR_0									                // LoRaMac datarates definition, from DR_0 to DR_5
#define LORAWAN_TX_POWER TX_POWER_5							              // LoRaMac tx power definition, from TX_POWER_0 to TX_POWER_15
#define JOINREQ_NBTRIALS 3										                // Number oftrials for the join request. 
DeviceClass_t LoRa_CurrentClass = CLASS_A;					          // class definition
LoRaMacRegion_t LoRa_CurrentRegion = LORAMAC_REGION_EU868;
lmh_confirm LoRa_CurrentConfirm = LMH_UNCONFIRMED_MSG;				// confirm/unconfirm packet definition
uint8_t LoRa_AppPort = LORAWAN_APP_PORT;							        // data port
static lmh_param_t LoRa_ParamInit = {LORAWAN_ADR_ON, LORAWAN_DATERATE, LORAWAN_PUBLIC_NETWORK, JOINREQ_NBTRIALS, LORAWAN_TX_POWER, LORAWAN_DUTYCYCLE_OFF};
static lmh_callback_t LoRa_Callbacks = {BoardGetBatteryLevel, BoardGetUniqueId, BoardGetRandomSeed,
                                          LoRa_rxHandler, LoRa_onHandlerJoined,
                                          LoRa_onConfirmClassHandler, LoRa_onFailedHandlerJoin,
                                          LoRa_onUncomfirmedSendFinished, lorawan_conf_finished
                                         };

// LoRa Structs
#define LORAWAN_APP_DATA_BUFF_SIZE 64                     // buffer size of the data to be transmitted. */
#define LORAWAN_APP_INTERVAL 15000
#define LORAWAN_APP_REJOIN 60000
static uint8_t m_lora_app_data_buffer[LORAWAN_APP_DATA_BUFF_SIZE];            //< Lora user application data buffer.
static lmh_app_data_t m_lora_app_data = {m_lora_app_data_buffer, 0, 0, 0, 0}; //< Lora user application data structure.

// ************************************ IDs ************************************
// #define D7 // Peter
#include "keys.h"
// *****************************************************************************


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

   // Initialize LoRa chip.
  Serial.println("[SUP][LoRa] Initialization started");
  lora_rak11300_init();
  Serial.println("[SUP][LoRa] Initialized");

  #ifdef GPS
  Serial.println("[SUP][GPS] Initialization started");
  pinMode(WB_IO2, OUTPUT);
  digitalWrite(WB_IO2, 0);
  delay(1000);
  digitalWrite(WB_IO2, 1);
  delay(1000);

  Serial.println("[SUP][GPS] Starting uart ...");
  Serial1.begin(9600);
  while (!Serial1){
    if ((millis() - timeout) < 10000){
      delay(100);
    }else{
      Serial.println("[SUP][GPS] UART init FAIL");
      break;
    }
  }
  Serial.println("[SUP][GPS] UART init OK");
  #else
  Serial.println("[SUP][GPS] Initialization skipped");
  #endif

  // Set LoRa configuration
  Serial.println("[SUP][LoRa] Setting configuration");
  if (doOTAA)
  {
    lmh_setDevEui(nodeDeviceEUI);
    lmh_setAppEui(nodeAppEUI);
    lmh_setAppKey(nodeAppKey);
  }
  else
  {
    lmh_setNwkSKey(nodeNwsKey);
    lmh_setAppSKey(nodeAppsKey);
    lmh_setDevAddr(nodeDevAddr);
  }
  Serial.println("[SUP][LoRa] Configuration set");

  // Initialize LoRaWan
  Serial.println("[SUP][LoRa] Initializing");
  uint32_t err_code = lmh_init(&LoRa_Callbacks, LoRa_ParamInit, doOTAA, LoRa_CurrentClass, LoRa_CurrentRegion);
  if (err_code != 0)
  {
    Serial.printf("[SUP][LoRa] LMH init failed - %d\n", err_code);
    return;
  }

  // Start Join procedure
  Serial.println("[SUP][LoRa] Start join procedure");
  lmh_join();
  Serial.println("[SUP][LoRa] Initialization finished");

  Serial.print("[SUP][EUI] Serial: ");
  for(int i = 0; i < 8; i++){
    Serial.print(nodeDeviceEUI[i], 16);
  }
  Serial.println();
  Serial.println("[SUP] ***** Setup completed! *****");

}

int aliveCounter = 0;
bool processGPSData(void);

int intToBuff(uint8_t* buffer, int index, int32_t input){
    buffer[index++] = (input & 0xFF000000) >> 24;
    buffer[index++] = (input & 0x00FF0000) >> 16;
    buffer[index++] = (input & 0x0000FF00) >> 8;
    buffer[index++] =  input & 0x000000FF;
    return index;
}

void loop() {
  // put your main code here, to run repeatedly:
  if (aliveCounter % 4 == 0)
  {
    Serial.print("[Loop] ");
    Serial.print(aliveCounter / 4);
    Serial.println(" Alive");
  }

  // Send data if requested
  if (doSend){
    Serial.println("[Loop][GPS] Attempting GPS read");
    bool result = processGPSData();
    doSend = false;
  }

  // Try rejoining 
  if (rejoin){
    Serial.println("[Loop][LoRa] Attempting rejoin");
    lmh_join();
    rejoin = false;
  }

  // Alive status
  aliveCounter ++;
  digitalWrite(LED_BUILTIN, aliveCounter % 2);
  sleep_ms(250);
}

bool processGPSData(){
  bool result = false;
  String tmpData = "";

  #ifdef GPS
    Serial.println("[GPS] Starting GPS read");
    bool newData = true; // TODO false
    #ifdef GPS_HARDCODE
    newData = true;
    #endif

    for (unsigned long start = millis(); millis() - start < 1000;) // Read for a second
    {
      while (Serial1.available())
      {
        char c = Serial1.read();
        Serial.write(c); // uncomment this line if you want to see the GPS data flowing
        tmpData += c;
        if (gps.encode(c))// Did a new valid sentence come in?
          newData = true;
      }
    }
    Serial.println(); // New line from GPS data

    Serial.println("[GPS] Data collected");

    int indexGPSFix = tmpData.indexOf("$GPGGA");

    if (indexGPSFix != -1){
      Serial.println("[GPS] GPGGA found");
      Serial.println("[GPS] Parsing location line");

      // Extract line from all recieved data
      int endIdx = tmpData.indexOf("\n", indexGPSFix);
      String lineGPGGA = tmpData.substring(indexGPSFix, endIdx);

      Serial.print("[GPS] Line: ");
      Serial.println(lineGPGGA);

      if (newData){
        Serial.println("[GPS] Parsing position");
        float flat, flon, falt, fhdop;
        int32_t ilat, ilon, ialt, ihdop;
        unsigned long age;

        #ifdef GPS_HARDCODE
        // flat = 46.0497496;
        // flon = 14.4690692;
        // falt = 301.4;
        flat = 46.048653;
        flon = 14.467621;
        falt = 299.53;
        fhdop = 264.08;
        #else
        gps.f_get_position(&flat, &flon, &age);
        falt = gps.f_altitude();
        fhdop = gps.hdop();
        #endif
        bool coordinatesOK = true;

        coordinatesOK &= flat != TinyGPS::GPS_INVALID_ANGLE;
        coordinatesOK &= flon != TinyGPS::GPS_INVALID_ANGLE;
        coordinatesOK &= falt != TinyGPS::GPS_INVALID_ALTITUDE;
        coordinatesOK &= fhdop != TinyGPS::GPS_INVALID_HDOP;
        
        ilat = flat * 100000;
        ilon = flon * 100000; 
        ialt = falt * 100;
        ihdop = fhdop * 100;

        Serial.print("[GPS] lat: ");
        Serial.print(ilat);
        Serial.print(", lon: ");
        Serial.print(ilon);
        Serial.print(", hdop: ");
        Serial.print(ihdop);
        Serial.print(", ialt: ");
        Serial.println(ialt);

        // Write to LoRa buffer
        memset(m_lora_app_data.buffer, 0, LORAWAN_APP_DATA_BUFF_SIZE);
        m_lora_app_data.port = LoRa_AppPort;

        int buffLen = 0;
        m_lora_app_data.buffer[buffLen++] = coordinatesOK? 255 : 0; // Coordinates OK prefix

        //latitude
        buffLen = intToBuff(m_lora_app_data.buffer, buffLen, ilat);

        if (lineGPGGA.indexOf("S") != -1){
          m_lora_app_data.buffer[buffLen++] = 'S';
        }else{
          m_lora_app_data.buffer[buffLen++] = 'N';
        }

        //longitude
        buffLen = intToBuff(m_lora_app_data.buffer, buffLen, ilon);

        if (lineGPGGA.indexOf("E") != 0){
          m_lora_app_data.buffer[buffLen++] = 'E';
        }else{
          m_lora_app_data.buffer[buffLen++] = 'W';
        }
        //alt
        buffLen = intToBuff(m_lora_app_data.buffer, buffLen, ialt);
        //hdop
        buffLen = intToBuff(m_lora_app_data.buffer, buffLen, ihdop);

        Serial.print("[GPS] Written ");
        Serial.print(buffLen);
        Serial.println("B to buffer");
        m_lora_app_data.buffsize = buffLen;
        Serial.println("[GPS] Writing data");
        result = sendLoRaFrame();
        Serial.println("[GPS] Data sent");

      }else{
        Serial.println("[GPS] No new data, parsing skipped");
      }
    }
  #endif

  return result;
}

// **************************************************
//               LoRa Methods
// **************************************************

int count = 0;
int countFail = 0;

bool sendLoRaFrame(void)
{
  Serial.print("[LoRa][SND] Join status: ");
  Serial.println(byte(lmh_join_status_get()));
  
  if (lmh_join_status_get() != LMH_SET)
  {
    //Not joined, try again later
    Serial.println("[LoRa][SND] Not joined");
    return false;
  }

  bool result;
  Serial.println("[LoRa][SND] Sending frame");

  //Send data
  lmh_error_status error = lmh_send(&m_lora_app_data, LoRa_CurrentConfirm);
  if (error == LMH_SUCCESS)
  {
    Serial.print("[LoRa][SND] OK count ");
    Serial.println(count++);
    result = true;
  }
  else
  {
    Serial.print("[LoRa][SND] Fail count");
    Serial.println(countFail++);
    result = false;
  }

  return result;
}

// **************************************************
//               LoRa Callbacks
// **************************************************

void LoRa_onHandlerJoined(void)
{
  if (doOTAA == true)
  {
    Serial.println("[LoRa] OTAA network joined");
  }
  else
  {
    Serial.println("[LoRa] ABP Mode");
  }

  lmh_error_status ret = lmh_class_request(LoRa_CurrentClass);
  if (ret == LMH_SUCCESS)
  {
    delay(1000);
    appTimer.attach(GPS_CheckTrigger, (std::chrono::microseconds)(LORAWAN_APP_INTERVAL * 1000));
  }
}

void LoRa_onFailedHandlerJoin(void)
{
  Serial.println("[LoRa] OTAA join failed!");
  Serial.println("[LoRa] Check your EUI's and Keys's!");
  Serial.println("[LoRa] Check if a Gateway is in range!");

  appTimer.attach(LoRa_RejoinHandler, (std::chrono::microseconds)(LORAWAN_APP_REJOIN  * 1000)); // Re-add callback
}

void LoRa_rxHandler(lmh_app_data_t *app_data)
{
  Serial.printf("[LoRa] Packet received on port %d, size:%d, rssi:%d, snr:%d, data:%s\n",
                app_data->port, app_data->buffsize, app_data->rssi, app_data->snr, app_data->buffer);
}

void LoRa_onConfirmClassHandler(DeviceClass_t Class)
{
  Serial.printf("[LoRa] Witch to class %c done\n", "ABC"[Class]);
  // Informs the server that switch has occurred
  m_lora_app_data.buffsize = 0;
  m_lora_app_data.port = LoRa_AppPort;
  lmh_send(&m_lora_app_data, LoRa_CurrentConfirm);
}

void LoRa_onUncomfirmedSendFinished(void)
{
  Serial.println("[LoRa][TX] Finished");
}

void lorawan_conf_finished(bool result)
{
  Serial.printf("[LoRa][TX] Confirmed %s\n", result ? "OK" : "NOK");
}


// **************************************************
//                 Generic callbacks
// **************************************************

void GPS_CheckTrigger(void){
  
  // DO NOT PUT PRINTS OR LENGTHY CODE IN THIS INTERRUPT HANDLER
  appTimer.attach(GPS_CheckTrigger, (std::chrono::microseconds)(LORAWAN_APP_INTERVAL * 1000)); // Re-add callback

  // Interrupt code
  doSend = true;
}

void LoRa_RejoinHandler(void){
  rejoin = true;
}
