let station;

class MediumConnection{
    constructor(mediumArrayBuffer, mediumPosition, station) {
        this.mediumArrayBuffer = mediumArrayBuffer;

        this.stationMediumBuffer = new SharedArrayBuffer(this.mediumSize);

        this.mediumSize = this.returnBufferView('medium').length;

        this.mediumPosition = mediumPosition;
        this.station = station;

        console.log("(( NEW CONNECTION IN "+this.mediumPosition+ " ))");
    }

    isMediumIdle() {
        return this.returnBufferView('medium')[this.mediumPosition] == 0;
    }

    returnBufferView(bufferType){
        switch(bufferType){
            case "medium":
                return new Int8Array(this.mediumArrayBuffer)
            break;
            case "station":
                return new Int8Array(this.mediumPosition)
            break;
        }
        
        return "error"
    }


    moveBits() {
        let stationMediumBuffer = this.returnBufferView('station');

        stationMediumBuffer[this.station.stationPosition + this.station.signalDistanceFromStation] = stationMediumBuffer[this.station.stationPosition];
        stationMediumBuffer[this.station.stationPosition - this.station.signalDistanceFromStation] = stationMediumBuffer[this.station.stationPosition];


        if(this.station.signalDistanceFromStation != 0){
            this.returnBufferView('station')[this.station.stationPosition + this.station.signalDistanceFromStation] += stationMediumBuffer[this.station.stationPosition + this.station.signalDistanceFromStation];
            this.returnBufferView('station')[this.station.stationPosition - this.station.signalDistanceFromStation] += stationMediumBuffer[this.station.stationPosition - this.station.signalDistanceFromStation];
        }else{
            this.returnBufferView('station')[this.station.stationPosition] += stationMediumBuffer[this.station.stationPosition];
        }
        

        this.station.signalDistanceFromStation++;


        if( this.station.signalDistanceFromStation > 8 - this.station.stationPosition){
            if(!this.station.isSendingJam){
                console.log("(( MACHINE " + this.station.macAddress + " WAS SUCESSFULL IN SENDING THE SIGNAL))");
                this.station.wantsToSend = false;
            }else{
                console.log("(( MACHINE " + this.station.macAddress + " DONE SENDING JAM SIGNAL))");
                this.station.isSendingJam = false;
            }

            this.station.isSendingSignal = false;
            this.station.signalDistanceFromStation = 0;
            this.cleanStationMedium();
        }
    }

    spreadSignal(amp){
        let doneSpreads = 0;
        

        if ((this.station.stationPosition - this.station.leftSpread) < 0) {
            this.station.doneReachEnd[0] = true;
            if (this.station.doneReachEnd[0] && this.station.doneReachEnd[1]) {
                if ((this.station.stationPosition + (this.station.stationPosition - this.station.leftSpread)) >= 0) {
                    
                    this.returnBufferView('medium')[this.station.stationPosition + (this.station.stationPosition - this.station.leftSpread)] -= amp;

                    this.station.leftSpread++;
                } else {
                    doneSpreads++;
                }
            }
        } else {
            this.returnBufferView('medium')[this.station.stationPosition - this.station.leftSpread] += amp;
            this.station.leftSpread++;
        }

        if ((this.station.stationPosition + this.station.rightSpread) >= this.mediumSize) {
            this.station.doneReachEnd[1] = true;
            if (this.station.doneReachEnd[0] && this.station.doneReachEnd[1]) {
                if ((this.station.stationPosition + ((this.station.stationPosition + this.station.rightSpread) - this.mediumSize)) < this.mediumSize) {
                    this.returnBufferView('medium')[this.station.stationPosition + ((this.station.stationPosition + this.station.rightSpread) - this.mediumSize)] -= amp;
                    this.station.rightSpread++;
                } else {
                    doneSpreads++;
                }
            }
        } else {
            this.returnBufferView('medium')[this.station.stationPosition + this.station.rightSpread] += amp;
            this.station.rightSpread++;
        }

        if(doneSpreads == 2)
            this.station.machineState = 'doneSending';

    }

    senseMedium(){
        if( this.returnBufferView('medium')[this.station.stationPosition] > this.returnBufferView('medium').length) // DETECTOU SINAL JAM
         {
            this.station.jammed = true;

            //Algoritmo backoff
            this.station.noCollision++;
            let m = Math.floor((Math.random() * 10) + this.station.noCollision);
            this.station.waitingTime = Math.floor((Math.random() * (Math.pow(2, m) - 1)));

             return "detectedJam";
         }   

        if(this.returnBufferView('medium')[this.station.stationPosition] > 1 && this.returnBufferView('medium')[this.station.stationPosition] < this.returnBufferView('medium').length) // COLISÃO !
        {
                this.station.currentSendingSignal = 'jam';
                this.station.machineState = "startedSending";

                this.station.jammed = true;

            return "sendingJam"
        }

        return "noError"
    }

    injectSignal(type) {
        switch(type){
            case "normal":
                this.returnBufferView('medium')[this.station.stationPosition] += 1;
            break;
            case "jam":
                this.returnBufferView('medium')[this.station.stationPosition] += this.returnBufferView('medium').length + 1;
            break;
        }
    }

}

class Station {
    constructor(machineState, mediumArrayBuffer, macAddress, stationPosition) {
        this.machineState = machineState;

        this.macAddress = macAddress;
        this.stationPosition = stationPosition;

        this.mediumConnection = new MediumConnection(mediumArrayBuffer, stationPosition, this);
        console.log("(( CREATED A NEW MACHINE " + macAddress + " ))");

        this.timeSlotsSinceStart = 0;

        let leftSpread = 0;
        let rightSpread = 0;

        let doneReachEnd = [false, false];

        let waitingTime = 0;
        let noCollision = 0;

        this.currentSendingSignal = "normal";
    }

    passTimeSlot(){
        this.timeSlotsSinceStart++;

        if(this.machineState != "waiting" && this.machineState != "startedWaiting" && this.currentSendingSignal === 'normal'){
            switch(this.mediumConnection.senseMedium()){
                case 'detectedJam':
                    this.machineState = 'startedWaiting';
                break;
            }
        }

        switch(this.machineState){
            case "idle":
            break;

            case "attemptSending":
                let returnedState = (this.mediumConnection.isMediumIdle() ? "startedSending" : "attemptSending")

                if (returnedState === "attemptSending" && this.jammed) {
                    if (this.noCollision >= 16) {
                        console.log("give up");
                    } else {
                        this.noCollision++;
                        let m = Math.floor((Math.random() * 10) + this.noCollision);
                        this.waitingTime = Math.floor((Math.random() * (Math.pow(2, m) - 1)));
                    }
                } else {
                    this.jammed = false;
                    this.machineState = returnedState;
                }
            break;

            case "startedSending":
                this.mediumConnection.injectSignal(this.currentSendingSignal);

                this.machineState = 'sending';

                this.leftSpread = 1;
                this.rightSpread = 1;
                this.doneReachEnd = [false, false];

            break;
            case "sending":
               /* if(this.deltaFromOrigin + 1 > this.mediumConnection.stationMediumBuffer.length - this.stationPosition){
                    this.machineState = "doneSending";
                }else{*/
                    
                    this.mediumConnection.spreadSignal((this.currentSendingSignal === 'normal' ? 1 : (this.currentSendingSignal === 'jam' ? this.mediumConnection.returnBufferView('medium').length + 1 : undefined)));
                //}
            break;
            case "doneSending":
                this.machineState = 'idle';
            break;


            case "startedWaiting":
                    this.mediumConnection.spreadSignal((this.currentSendingSignal === 'normal' ? 1 : (this.currentSendingSignal === 'jam' ? this.mediumConnection.returnBufferView('medium').length + 1 : undefined)));
                    console.log("started waiting" + this.mediumConnection.mediumPosition);
                    this.machineState = "waiting";
            break;
            case "waiting":
                    this.mediumConnection.spreadSignal((this.currentSendingSignal === 'normal' ? 1 : (this.currentSendingSignal === 'jam' ? this.mediumConnection.returnBufferView('medium').length + 1 : undefined)));

                    this.waitingTime--;
                    if (this.waitingTime == 0)
                        this.machineState = "doneWaiting";
            break;
            case "doneWaiting":
                  this.mediumConnection.spreadSignal((this.currentSendingSignal === 'normal' ? 1 : (this.currentSendingSignal === 'jam' ? this.mediumConnection.returnBufferView('medium').length + 1 : undefined)));
                  this.machineState = 'idle';

                  if (this.jammed = true)
                      this.machineState = 'attemptSending'

            break;

            default:

            break;
        }

        sendMessage({type: "machineState", information: {machineState: this.machineState, stationPosition: this.stationPosition}});
    } 
}

class Frame {
    constructor(sourceStation, destinationStation, frameLengthBits) {
        this.sourceStation = sourceStation;
        this.destinationStation = destinationStation;

        this.bitsArray = this.generateRandomBitsArray(frameLengthBits);

        this.frameLengthBits = frameLengthBits;
        this.bitColor = this.randomColorGenerator();
    }

    generateRandomBitsArray(frameLengthBits) {
        let bitsArray = [];
        for (let i = 0; i < frameLengthBits; i++) {
            bitsArray.push(Math.floor(Math.random() * 2));
        }
        return bitsArray;
    }

    randomColorGenerator() {
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) 
            color += letters[Math.floor(Math.random() * 16)];
        
        return color;
    }
}

class Request{
}

class Timer{
    /*constructor(){
        this.isRunning = true;
    }

    runTimer(resolve, self){
        console.log(resolve);
        this.isRunning = false;
        setTimeout(resolve.bind(self), 1000);
    }*/
}


self.onmessage = function (msg) {
    switch (msg.data.type) {
        case 'threadInitialization':
                station = new Station(msg.data.information.machineState, msg.data.information.mediumArray, msg.data.information.macAddress, parseInt(msg.data.information.stationPosition));
            break;
        case 'passTimeSlot':
                station.passTimeSlot();
            break;
        case 'injectSignal':
                station.currentSendingSignal = 'normal';
                station.machineState = "attemptSending";
                //station.wantsToSend = true;
            break;
        default:
            throw 'no aTopic on incoming message to ChromeWorker';
    }
}

function sendMessage(object){
    self.postMessage({type: object.type, information: object.information});
}