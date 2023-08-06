import socket
from threading import Thread
import json
import time 

HOST = "127.0.0.1"  # loop back on localhost
TxPORT = 7887 # Port to listen for GUI commands
RxPORT = 7997 # Port to report telemetry

butter_increments = [0, 0.13]
sugar_increments = [0, 0.05, 0.1, 0.15, 0.2, 0.25]
milk_increments = [0, 0.05]

# globals of the current status of each of the settings
butter_status = 0
sugar_status = 0
milk_status = 0
total_weight = 0
mix_timer = 0
sugar_butter_ratio = 0
mix_milk_ratio = 0
mixer_status = 0  # To keep track of the mixer status (0 for off, 1 for on)


def CheckReturn(dic, key):
    if key in dic.keys():
        return(dic[key])
    else:
        return(None)

def SystemUpdate():
    global total_weight 
    global butter_status
    global sugar_status 
    global milk_status
    print("milk status      " + str(milk_status))
    print("sugar status     " + str(sugar_status))
    print("butter status    " + str(butter_status))
    # updates all the weights based on system conditions
    if butter_status in range(0,len(butter_increments),1):
        total_weight = total_weight + butter_increments[butter_status] 
    if sugar_status in range(0,len(sugar_increments),1):
        total_weight = total_weight + sugar_increments[sugar_status] 
    if milk_status in range(0,len(milk_increments),1):
        total_weight = total_weight + milk_increments[milk_status] 

def CommandCenter(): # super generic server to receive commands, only handles commands
    global butter_status
    global sugar_status 
    global milk_status
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind((HOST, RxPORT))
        s.listen()                              # wait for GUI to connect
        conn, addr = s.accept()                 # accept connection
        with conn:                              # receive connections
            print("Connection established.")
            while True:
                data = conn.recv(1024)          # packet should not be larger than 1024 bytes
                if not data:
                    break
                try:
                    formatted_data = data.decode('utf-8').strip()
                    command = json.loads(formatted_data)   # convert packet to a dict
                except:
                    print("CommandCenter: Error loading command. Is it formatted correctly?")
                    command = {}
                
                retVal = CheckReturn(command,'BttrPmp')
                if retVal != None:
                    butter_status = retVal      # check if command, update
                
                retVal = CheckReturn(command,'MlkPmp')
                if retVal != None:
                    milk_status = retVal        # check if command, update

                retVal = CheckReturn(command,'SgrDisp')
                if retVal != None:
                    sugar_status = retVal      # check if command, update
                
                time.sleep(1)


def TelemetryCenter():
    global total_weight, butter_status, sugar_status, milk_status, mixer_status, mix_timer
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind((HOST, TxPORT))
        s.listen()
        conn, addr = s.accept()                 # accept connection
        with conn:
            while True:
                pay = {}
                pay['MXR_LBS'] = total_weight
                pay['MixTimer'] = mix_timer if mixer_status == 1 else 0

                try:
                    sugar_status_int = int(sugar_status)
                except ValueError:
                    sugar_status_int = 0
                
                try:
                    butter_status_int = int(butter_status)
                except ValueError:
                    butter_status_int = 0

                # Calculate the sugar to butter ratio
                pay['SgrRatio'] = sugar_status_int / butter_status_int if butter_status_int != 0 else 0

                # Calculate the sugar/butter mix to milk ratio
                # Make sure that milk_status is not 0 to avoid division by zero
                pay['MixRatio'] = (sugar_status_int + butter_status_int) / milk_status if milk_status != 0 else 0

                payload = json.dumps(pay)
                conn.sendall(payload.encode('utf-8'))
                SystemUpdate()
                time.sleep(1)
        
def test_space_RX():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('0.0.0.0', TxPORT))
        s.listen()
        conn, addr = s.accept()                 # accept connection
        with conn:
            while True:
                data = conn.recv(1024)     #get and print data
                print(data)
                time.sleep(1)

def test_space_TX():   # script to cycle through different settings
    time.sleep(2)
    test_packet = {}
    tx_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    tx_socket.connect(("0.0.0.0", RxPORT))

    ## Butter Pump Test
    test_packet['BttrPmp'] = 1
    print("Butter Pump at 1")
    payload = json.dumps(test_packet)
    tx_socket.sendall(payload.encode('utf-8'))
    time.sleep(10)
    test_packet['BttrPmp'] = 0
    print("Butter Pump at 0")
    payload = json.dumps(test_packet)
    tx_socket.sendall(payload.encode('utf-8'))
    time.sleep(10)
    ## Milk Pump Test
    test_packet['MlkPmp'] = 1
    print("Milk Pump at 1")
    payload = json.dumps(test_packet)
    tx_socket.sendall(payload.encode('utf-8'))
    time.sleep(10)
    test_packet['MlkPmp'] = 0
    print("Milk Pump at 0")
    payload = json.dumps(test_packet)
    tx_socket.sendall(payload.encode('utf-8'))
    time.sleep(10)
    ## Sugar Disp Test
    test_packet['SgrDisp'] = 1
    print("Sugar Disp at 1")
    payload = json.dumps(test_packet)
    tx_socket.sendall(payload.encode('utf-8'))
    time.sleep(7)
    test_packet['SgrDisp'] = 0
    print("Sugar Disp at 0")
    payload = json.dumps(test_packet)
    tx_socket.sendall(payload.encode('utf-8'))
    time.sleep(7)
    test_packet['SgrDisp'] = 2
    print("Sugar Disp at 2")
    payload = json.dumps(test_packet)
    tx_socket.sendall(payload.encode('utf-8'))
    time.sleep(7)
    test_packet['SgrDisp'] = 0
    print("Sugar Disp at 0")
    payload = json.dumps(test_packet)
    tx_socket.sendall(payload.encode('utf-8'))
    time.sleep(7)
    test_packet['SgrDisp'] = 3
    print("Sugar Disp at 3")
    payload = json.dumps(test_packet)
    tx_socket.sendall(payload.encode('utf-8'))
    time.sleep(7)
    test_packet['SgrDisp'] = 0
    print("Sugar Disp at 0")
    payload = json.dumps(test_packet)
    tx_socket.sendall(payload.encode('utf-8'))
    time.sleep(7)
    test_packet['SgrDisp'] = 4
    print("Sugar Disp at 4")
    payload = json.dumps(test_packet)
    tx_socket.sendall(payload.encode('utf-8'))
    time.sleep(7)
    test_packet['SgrDisp'] = 0
    print("Sugar Disp at 0")
    payload = json.dumps(test_packet)
    tx_socket.sendall(payload.encode('utf-8'))
    time.sleep(7)
    test_packet['SgrDisp'] = 5
    print("Sugar Disp at 5")
    payload = json.dumps(test_packet)
    tx_socket.sendall(payload.encode('utf-8'))
    time.sleep(7)
    test_packet['SgrDisp'] = 0
    print("Sugar Disp at 0")
    payload = json.dumps(test_packet)
    tx_socket.sendall(payload.encode('utf-8'))
    print("END OF RUN")




if __name__ == "__main__":
    cmd_c = Thread(target = CommandCenter, args = ( ))
    tlm_c = Thread(target = TelemetryCenter, args = ( ))
    # test_c = Thread(target = test_space_RX, args = ( )) # Uncomment to test commands
    # test_s = Thread(target = test_space_TX, args = ( )) # Uncomment to test commands
    # test_c.start() # Uncomment to test commands
    cmd_c.start()
    tlm_c.start()
    # test_s.start() # Uncomment to test commands