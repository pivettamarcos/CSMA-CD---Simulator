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
        console.log(this.returnBufferView('station'));
    }

    spreadSignal(amp){
        let doneSpreads = 0;

        if((this.station.stationPosition - this.station.deltaFromOrigin) < 0){
            if((this.station.stationPosition + (this.station.stationPosition - this.station.deltaFromOrigin)) >= 0)
                this.returnBufferView('medium')[this.station.stationPosition + (this.station.stationPosition - this.station.deltaFromOrigin)] -= amp;
            else
                doneSpreads++;
            
         } else{
            this.returnBufferView('medium')[this.station.stationPosition - this.station.deltaFromOrigin] += amp;
         }

        if((this.station.stationPosition + this.station.deltaFromOrigin) >= this.mediumSize){
            if((this.station.stationPosition + ((this.station.stationPosition + this.station.deltaFromOrigin) - this.mediumSize)) < this.mediumSize)
                this.returnBufferView('medium')[this.station.stationPosition + ((this.station.stationPosition + this.station.deltaFromOrigin) - this.mediumSize)] -= amp;
            else
                doneSpreads++;
        }else{
            this.returnBufferView('medium')[this.station.stationPosition + this.station.deltaFromOrigin] += amp;
        }

        if(doneSpreads == 2)
            this.station.machineState = 'doneSending';
    }

    senseMedium(){
        if( this.returnBufferView('medium')[this.station.stationPosition] > this.returnBufferView('medium').length) // DETECTOU SINAL JAM
         {
             console.log("detected jam "+ this.mediumPosition)
             return "detectedJam";
         }   

        if(this.returnBufferView('medium')[this.station.stationPosition] > 1 && this.returnBufferView('medium')[this.station.stationPosition] < this.returnBufferView('medium').length) // COLISÃO !
        {
                this.station.currentSendingSignal = 'jam';
                this.station.machineState = "startedSending";

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

        this.deltaFromOrigin = 0;

        this.currentSendingSignal = "normal";
    }

    passTimeSlot(){
        this.timeSlotsSinceStart++;

        console.log(this.machineState);

        if(this.machineState != "waiting" && this.machineState != "startedWaiting" && this.currentSendingSignal === 'normal'){
            switch(this.mediumConnection.senseMedium()){
                case 'detectedJam':
                    this.machineState = 'startedWaiting';
                break;
            }
        }

        switch(this.machineState){
            case "idle":
                console.log("machine is idling");
            break;

            case "attemptSending":
                console.log("machine will attempt to send");

                this.machineState = (this.mediumConnection.isMediumIdle() ? "startedSending" : "attemptSending")
            break;

            case "startedSending":
                console.log("machine started sending");
                this.mediumConnection.injectSignal(this.currentSendingSignal);

                this.machineState = 'sending';

                this.deltaFromOrigin = 0;

            break;
            case "sending":
               /* if(this.deltaFromOrigin + 1 > this.mediumConnection.stationMediumBuffer.length - this.stationPosition){
                    this.machineState = "doneSending";
                }else{*/
                    this.deltaFromOrigin++;
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

            break;
            case "doneWaiting":
                    this.mediumConnection.spreadSignal((this.currentSendingSignal === 'normal' ? 1 : (this.currentSendingSignal === 'jam' ? this.mediumConnection.returnBufferView('medium').length + 1 : undefined)));

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
                console.log(new Int8Array(msg.data.information.mediumArray));
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
    console.log("seneettttttttttttttttttttttttttttttt")
    self.postMessage({type: object.type, information: object.information});
}