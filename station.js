let station;

class MediaConnection{
    constructor(mediaArrayBuffer, mediaPosition, station) {
        this.mediaArrayBuffer = mediaArrayBuffer;
        this.mediaPosition = mediaPosition;
        this.station = station;

        console.log("(( NEW CONNECTION IN "+this.mediaPosition+ " ))");
    }

    isMediaIdle() {
        let idleCont = 0;
        for(let i = 0; i < this.mediaArrayBuffer.length; i++){
            idleCont + this.mediaArrayBuffer[i];
        }
        if(idleCont == 0)
            return true;
        
        return false;
        //this.station.requests.push(new Request());
        /*console.log(this.media);
        for (let i = 0; i < this.media.dataArray.bits.length; i++)
            if (this.media.dataArray.bits[i])
                return false;

        return true;*/
    }

    returnMediaPositionOfStation(stationMAC) {
        /*for (let i = 0; i < this.media.connections.length; i++) {
            if (this.media.connections[i] !== undefined)
                if (this.media.connections[i].station.macAddress === stationMAC)
                    return this.media.connections[i].mediaPosition;
        }*/
    }

    injectFrame(frameValue) {
        
        this.mediaArrayBuffer[1] = 1;
        console.log(this.mediaArrayBuffer);
       /* if (this.isMediaIdle)
            this.media.injectBit(direction, bitValue, this.mediaPosition);*/
    }

    clearMediaArray(){
        for(let i = 0; i < this.mediaArrayBuffer.length; i++){
            this.mediaArrayBuffer[i] = 0;
        }
    }
}

class Station {
    constructor(mediaArrayBuffer, macAddress, stationPosition) {
        this.requestID = 0;
        this.requests = [];

        this.macAddress = macAddress;
        this.stationPosition = stationPosition;
        this.connection = new MediaConnection(mediaArrayBuffer, stationPosition, this);
        console.log("(( CREATED A NEW MACHINE " + macAddress + " ))");

        this.timer;

        setTimeout(this.sendFrameToMedia(), 1000);
    }

    assembleFrame(frameLengthBits) {
        let frame = new Frame(5);

        return frame;
    }

    sendFrameToMedia(frameValue) {
        if(this.connection.isMediaIdle){
            this.connection.injectFrame(frameValue);
            this.timer = new Timer();

            this.timer.runTimer(this.stopFrameSending, this);
        }
            
    }

    stopFrameSending(){
        this.connection.clearMediaArray();
        console.log("stopped sending");
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
    constructor(){
        this.isRunning = true;
    }

    runTimer(resolve, self){
        console.log(resolve);
        this.isRunning = false;
        setTimeout(resolve.bind(self), 1000);
    }
}


self.onmessage = function (msg) {
    switch (msg.data.type) {
        case 'threadInitialization':
                console.log(new Int8Array(msg.data.information.mediaArray));

                station = new Station(new Int8Array(msg.data.information.mediaArray),msg.data.information.macAddress, msg.data.information.stationPosition);
            break;
        default:
            throw 'no aTopic on incoming message to ChromeWorker';
    }
}