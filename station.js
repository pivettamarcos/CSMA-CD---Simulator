importScripts("subworkers.js");

let station;

class MediumConnection{
    constructor(mediumArrayBuffer, mediumPosition, station) {
        this.mediumArrayBuffer = mediumArrayBuffer;

        this.stationMediumBuffer = new SharedArrayBuffer(this.mediumSize);

        this.mediumSize = this.returnBufferView('medium').length;

        this.mediumPosition = mediumPosition;
        this.station = station;

        this.jams = [];

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
        
        if(doneSpreads < 2){
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
        }
        if (doneSpreads == 2) {
            if(!this.station.jammed)
                this.station.machineState = 'doneSending';
        }

    }

    senseMedium(){
        if( this.returnBufferView('medium')[this.station.stationPosition] > this.returnBufferView('medium').length) // DETECTOU SINAL JAM !
         {
            //Algoritmo backoff

            this.station.noCollision++;
            let m = Math.floor((Math.random() * 10) + this.station.noCollision);
            this.station.waitingTime = Math.floor((Math.random() * (Math.pow(2, m) - 1)));

            this.station.sendJam = true;
            this.station.jammed = true;

             return "detectedJam";
         }   

        if(this.returnBufferView('medium')[this.station.stationPosition] > 1 
            && this.returnBufferView('medium')[this.station.stationPosition] < this.returnBufferView('medium').length) // DETECTOU COLISÃO !
        {
               // this.station.currentSendingSignal = 'jam';
               // this.station.machineState = "startedSending";

                //this.station.jammed = true;
                this.station.noCollision++;
                let m = Math.floor((Math.random() * 10) + this.station.noCollision);
                this.station.waitingTime = Math.floor((Math.random() * (Math.pow(2, m))));

                let worker = new Worker('jam.js');
                worker.postMessage({ type: "threadInitialization", 
                    information: { origin: this.station.stationPosition, bufferMedium: this.mediumArrayBuffer } });

                this.jams.push(worker);

                this.station.sendJam = true;
                
                this.station.jammed = true;

            return "detectedCollision"
        }

        return "noError"
    }

    injectSignal(type) {
        this.returnBufferView('medium')[this.station.stationPosition] += 1;
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

        this.leftSpread = 0;
        this.rightSpread = 0;

        this.doneReachEnd = [false, false];

        this.waitingTime = 0;
        this.noCollision = 0;

        this.waitingTime = 0;

        this.wantsToSend = false;

        this.currentSendingSignal = "normal";
    }

    passTimeSlot() {

        for (let i = 0; i < this.mediumConnection.jams.length; i++) {
            if(this.mediumConnection.jams[i])
                this.mediumConnection.jams[i].postMessage({ type: "passTimeSlot", information: {} });
        }

        this.timeSlotsSinceStart++;

        if (this.machineState != "waiting" && this.machineState != "startedWaiting" && !this.jammed && this.currentSendingSignal === 'normal' && this.machineState != "idle") {
            switch(this.mediumConnection.senseMedium()){
                case 'detectedJam':
                    this.machineState = 'startedWaiting';
                    break;
                case 'detectedCollision':
                    this.machineState = 'startedWaiting';
                    break;
            }
        }

        switch(this.machineState){
            case "idle":
            break;

            case "attemptSending":
                console.log("tentou" + this.stationPosition)
                let returnedState = (this.mediumConnection.isMediumIdle() ? "startedSending" : "attemptSending")

                if (returnedState === "attemptSending" && this.jammed) {
                    if (this.noCollision >= 16) {
                        console.log("give up");
                    } else {
                        this.noCollision++;
                        let m = Math.floor((Math.random() * 10) + this.noCollision);
                        this.waitingTime = Math.floor((Math.random() * (Math.pow(2, m) - 1)));

                        this.machineState = 'startedWaiting';
                    }
                }  else if (returnedState !== "attemptSending") {
                    this.jammed = false;
                    this.machineState = 'startedSending';
                }
            break;

            case "startedSending":
                console.log("injectou" + this.stationPosition);
                this.mediumConnection.injectSignal();

                this.machineState = 'sending';

                this.leftSpread = 1;
                this.rightSpread = 1;
                this.doneReachEnd = [false, false];

            break;
            case "sending":
               /* if(this.deltaFromOrigin + 1 > this.mediumConnection.stationMediumBuffer.length - this.stationPosition){
                    this.machineState = "doneSending";
                }else{*/
                    
                    this.mediumConnection.spreadSignal(1);
                //}
            break;
            case "doneSending":
                this.machineState = 'idle';
            break;


            case "startedWaiting":
                    this.mediumConnection.spreadSignal(1);
                    this.machineState = "waiting";
            break;
            case "waiting":
                    this.mediumConnection.spreadSignal(1);

                    this.waitingTime--;
                    if (this.waitingTime <= 0)
                        this.machineState = "doneWaiting";
            break;
            case "doneWaiting":
                this.mediumConnection.spreadSignal(1);
            
                 this.waitingTime = 0;
                  if (this.jammed)
                      this.machineState = 'attemptSending'
                  else
                      this.machineState = 'idle';

            break;

            default:

            break;
        }

        sendMessage({type: "machineState", information: {machineState: this.machineState, stationPosition: this.stationPosition, waitingTime: this.waitingTime}});
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
            console.log("inject signal in" + station.stationPosition);
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