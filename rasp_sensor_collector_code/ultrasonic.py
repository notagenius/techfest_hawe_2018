#Bibliotheken einbinden
import RPi.GPIO as GPIO
import time
import pymongo
 
#GPIO Modus (BOARD / BCM)
GPIO.setmode(GPIO.BCM)
 
#GPIO Pins zuweisen
GPIO_TRIGGER = 18
GPIO_ECHO = 24
 
#Richtung der GPIO-Pins festlegen (IN / OUT)
GPIO.setup(GPIO_TRIGGER, GPIO.OUT)
GPIO.setup(GPIO_ECHO, GPIO.IN)
 
def distanz():
    # setze Trigger auf HIGH
    GPIO.output(GPIO_TRIGGER, True)
 
    # setze Trigger nach 0.01ms aus LOW
    time.sleep(0.00001)
    GPIO.output(GPIO_TRIGGER, False)
 
    StartZeit = time.time()
    StopZeit = time.time()
 
    # speichere Startzeit
    while GPIO.input(GPIO_ECHO) == 0:
        StartZeit = time.time()
 
    # speichere Ankunftszeit
    while GPIO.input(GPIO_ECHO) == 1:
        StopZeit = time.time()
 
    # Zeit Differenz zwischen Start und Ankunft
    TimeElapsed = StopZeit - StartZeit
    # mit der Schallgeschwindigkeit (34300 cm/s) multiplizieren
    # und durch 2 teilen, da hin und zurueck
    distanz = (TimeElapsed * 34300) / 2
 
    return distanz
 
if __name__ == '__main__':
    try:
	uri = "mongodb://safetyaid:hibKenkjGdswKUrrqpqHbMuj6bsFV51PJ0Xfd7y7bYmBe1y2uGwwYXG9zsVPuIwgEnsfnUS4LQGVOGWFOmpDSg==@safetyaid.documents.azure.com:10255/?ssl=true&replicaSet=globaldb"
	client = pymongo.MongoClient(uri)
	db = client.safetyaid

	us_data = db.ultrasonic_data
        while True:
		abstand = distanz()
		measure = {
			"distance": abstand
		}
		print ("Gemessene Entfernung = %.1f cm" % abstand)
		us_data.insert_one(measure)
		time.sleep(1)
 
        # Beim Abbruch durch STRG+C resetten
    except KeyboardInterrupt:
        print("Messung vom User gestoppt")
        GPIO.cleanup()


