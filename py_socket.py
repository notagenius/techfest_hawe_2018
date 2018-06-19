from socketIO_client import SocketIO, LoggingNamespace

def on_acceleration_sample(*args):
    print('acceleration_sample', args)

def on_magnitude_sample(*args):
    print('magnitude_sample', args)

def on_distance_sample(*args):
    print('distance_sample', args)

def on_gyroscope_sample(*args):
    print('gyroscope_sample', args)

with SocketIO('http://safetyaid.herokuapp.com', 80, LoggingNamespace) as socketIO:
    socketIO.on('magnitude_sample', on_acceleration_sample)
    socketIO.on('acceleration_sample', on_magnitude_sample)
    socketIO.on('distance_sample', on_distance_sample)
    socketIO.on('gyroscope_sample', on_gyroscope_sample)
    socketIO.emit('acceleration_sample', "1,2,3")
    socketIO.wait(seconds=1)

