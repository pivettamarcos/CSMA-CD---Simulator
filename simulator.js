let simulation;

class Media {
    constructor() {
        this.sharedMediaBuffer = this.initializeSharedArrayBuffer();
        this.bufferView;
        /*this.arr = new Int8Array(this.sharedBuffer);
        /* setting data 
        this.arr[0] = 9;

        this.rightGoingBits = new Array(numBits);
        this.leftGoingBits = new Array(numBits);

        this.numBits = 8;*/
    }

    initializeSharedArrayBuffer(){
        let sharedMediaBuffer = new SharedArrayBuffer(8);
        let bufferView = new Int8Array(this.sharedMediaBuffer)
        for(let i = 0; i < bufferView.length; i++){
            bufferView[i] = 0;
        }

        this.bufferView = bufferView;

        return sharedMediaBuffer;
    }

    /*
    updateDataArray() {
        this.moveBits();
    }

    moveBits() {
        let newBitArray = new Array(this.numBits);
        for (let i = 0; i < this.rightGoingBits.length - 1; i++)
            newBitArray[i + 1] = this.rightGoingBits[i];

        this.rightGoingBits = newBitArray;

        newBitArray = new Array(this.numBits);
        for (let i = this.leftGoingBits.length - 1; i > 0; i--)
            newBitArray[i - 1] = this.leftGoingBits[i];

        this.leftGoingBits = newBitArray;
    }*/
}

/*
class MediaConnection{
    constructor(mediaPosition, station, media) {
        this.mediaPosition = mediaPosition;
        this.station = station;
        this.media = media;

        console.log("(( NEW CONNECTION IN "+this.mediaPosition+ " ))");
    }

    isMediaIdle() {
        console.log(this.media);
        for (let i = 0; i < this.media.dataArray.bits.length; i++)
            if (this.media.dataArray.bits[i])
                return false;

        return true;
    }

    returnMediaPositionOfStation(stationMAC) {
        for (let i = 0; i < this.media.connections.length; i++) {
            if (this.media.connections[i] !== undefined)
                if (this.media.connections[i].station.macAddress === stationMAC)
                    return this.media.connections[i].mediaPosition;
        }
    }

    injectBit(direction, bitValue) {
        if (this.isMediaIdle)
            this.media.injectBit(direction, bitValue, this.mediaPosition);
    }
}

class Station {
    constructor(media, macAddress, stationPosition) {
        this.macAddress = macAddress;
        this.stationPosition = stationPosition;
        this.connection = media.createConnection(this, stationPosition);
        console.log("(( CREATED A NEW MACHINE " + macAddress + " ))");
    }

    assembleFrame(frameLengthBits) {
        let frame = new Frame(5);

        return frame;
    }

    sendBitToStation(receiverMAC, bitValue) {
        if (this.connection.returnMediaPositionOfStation(receiverMAC) > this.stationPosition)
            this.injectBit("rightGoing", bitValue)
        else
            this.injectBit("leftGoing", bitValue)
    }

    injectBit(direction, bitValue) {
        console.log("inhjet" + direction);
        this.connection.injectBit(direction, bitValue);
    }
}*/

/*
/*class Frame {
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
}*/

class MACGenerator {
    constructor() {
        this.runningMACs = [];
    }

    assignNewMAC() {
        let isUnique = true; 
        let newMAC;
        let escapeCont = 0;
        do{
            isUnique = true;
            newMAC = this.generateNewMac();
            for (let i = 0; i < this.runningMACs.length; i++) {
                if (newMAC === this.runningMACs[i])
                    isUnique = false;
            }
            escapeCont++;
        }while(!isUnique || escapeCont > 257)

        if(escapeCont > 257)
            return undefined;

        this.runningMACs.push(newMAC);
        return newMAC;
    }

    generateNewMac() {
        var hexDigits = "0123456789ABCDEF";
        var macAddress = "";
        for (var i = 0; i < 6; i++) {
            macAddress += hexDigits.charAt(Math.round(Math.random() * 15));
            macAddress += hexDigits.charAt(Math.round(Math.random() * 15));
            if (i != 5) macAddress += ":";
        }

        return macAddress;
    }
}

class Simulation {
    constructor(secsBetweenTimeSlots, mediaSize, MACGenerator) {
        this.timeSlotsSinceStart = 0;

        this.secsBetweenTimeSlots = secsBetweenTimeSlots;

        this.media = new Media(mediaSize);
        this.stations = new Array(mediaSize);

        this.MACGenerator = MACGenerator;

        this.simulationClock = undefined;

        this.startSimulation();
    };

    startSimulation() {
        console.log("== Simulation Started ==");
        //console.log("// ASSIGNING IPs WITH DHCP SERVER \\");

        /*for (let i = 0; i < this.numStations; i++)
            this.createStation();*/

        this.simulationClock = setInterval(this.passTimeSlot.bind(this), this.secsBetweenTimeSlots);
    };

    createStation(stationPosition) {
        let successfull = true;
        if(this.stations[stationPosition] === undefined){
            let newMAC = this.MACGenerator.assignNewMAC();
            if (newMAC) {
                let worker = new Worker('station.js');
                this.stations[stationPosition] = worker;

                worker.postMessage({type: "threadInitialization", information: {mediaArray: this.media.sharedMediaBuffer ,macAddress: newMAC, stationPosition: stationPosition}});

                worker.onmessage = function(e) {
                    console.log('Message received from worker');
                }

                this.stations.push(worker);
            }else{
                console.log("xx NO MAC AVAILABLE xx");
            }
        }else{
            console.log("xx MEDIA POSITION UNAVAILABLE xx");
        }
    }

    assignMacAddresses() {
        for (let i = 0; i < this.stations.length; i++) {
            this.stations[i]
        }
    }

    changeSecsBetweenTimeSlots(newSecsBetweenTimeSlots) {
        this.secsBetweenTimeSlots = newSecsBetweenTimeSlots;
        clearInterval(this.simulationClock);

        this.simulationClock = setInterval(this.passTimeSlot.bind(this), this.secsBetweenTimeSlots);
    }

    passTimeSlot() {
        this.timeSlotsSinceStart++;
        console.log(new Int8Array(this.media.sharedMediaBuffer));
       //console.log("-- Time slots since start -- (" + this.timeSlotsSinceStart + ")");
    };

    getMachineWithMAC(MAC) {
        for (let i = 0; i < this.stations.length; i++)
            if (this.stations[i].macAddress == MAC)
                return this.stations[i];
    }
}

function runSimulation() {
    simulation = new Simulation(3000, 8, new MACGenerator());

    addEventListeners();
}

//ADD EVENT LISTENERS
function addEventListeners() {
    document.getElementById("buttonChangeSecsBetweenTimeSlots").addEventListener("click", () => {
        let inputText = document.getElementById("inputChangeSecsBetweenTimeSlots").value;

        console.log("** Changed seconds between time slots to (" + inputText +"s) **");
        simulation.changeSecsBetweenTimeSlots(document.getElementById("inputChangeSecsBetweenTimeSlots").value);
    });

    document.getElementById("buttonAssembleFrame").addEventListener("click", () => {
        console.log("++ Assembling frame "+simulation.stations[0].assembleFrame());
    });

    document.getElementById("buttonCreateStation").addEventListener("click", () => {
        simulation.createStation(document.getElementById("inputStationPosition").value);
    });

    document.getElementById("buttonInjectBit").addEventListener("click", () => {
        simulation.getMachineWithMAC(document.getElementById("inputStationEmitter").value).sendBitToStation(document.getElementById("inputStationReceiver").value, 1);
    });

   /* document.getElementById("buttonIsMediaIdle").addEventListener("click", () => {
        console.log("Is media idle? "+simulation.stations[0].isMediaIdle());
    });*/
}


//RUN SIMULAT"ION IF WINDOW LOAD
window.onload = runSimulation;

