from pymongo import MongoClient

client = MongoClient('localhost', 27017)
db = client.safetyaid
acc_data = db.acceleration_data
gyr_data = db.gyroscope_data
mag_data = db.magnitude_data
ult_data = db.ultrasonic_data


with open('./rasp_sensor_collector_code/acceldata.txt', 'r') as f:
    for x in f:
        x = x.rstrip()
        if not x: continue
        data = x.split(',')
        timestamp = data[0]
        acc_x = float(data[2] if len(data) == 5 else data[1])
        acc_y = float(data[3] if len(data) == 5 else data[2])
        acc_z = float(data[4] if len(data) == 5 else data[3])
        sample = {
            "timestamp": timestamp,
            "acc_x": acc_x,
            "acc_y": acc_y,
            "acc_z": acc_z
        }
        acc_data.insert_one(sample)

with open('./rasp_sensor_collector_code/gyrodata.txt', 'r') as f:
    for x in f:
        x = x.rstrip()
        if not x: continue
        data = x.split(',')
        timestamp = data[0]
        gyro_x = float(data[2] if len(data) == 5 else data[1])
        gyro_y = float(data[3] if len(data) == 5 else data[2])
        gyro_z = float(data[4] if len(data) == 5 else data[3])
        sample = {
            "timestamp": timestamp,
            "gyro_x": gyro_x,
            "gyro_y": gyro_y,
            "gyro_z": gyro_z
        }
        gyr_data.insert_one(sample)
        
with open('./rasp_sensor_collector_code/magdata.txt', 'r') as f:
    for x in f:
        x = x.rstrip()
        if not x: continue
        data = x.split(',')
        timestamp = data[0]
        mag_x = float(data[2] if len(data) == 5 else data[1])
        mag_y = float(data[3] if len(data) == 5 else data[2])
        mag_z = float(data[4] if len(data) == 5 else data[3])
        sample = {
            "timestamp": timestamp,
            "mag_x": mag_x,
            "mag_y": mag_y,
            "mag_z": mag_z
        }
        mag_data.insert_one(sample)