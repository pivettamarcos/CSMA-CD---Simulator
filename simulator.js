let simulation;

class MediaDataArray {
    constructor(numBits) {
        this.bits = new Array(numBits);
        this.numBits = numBits;
    }

    initializeBitArray() {
        for (let i = 0; i < this.numBits; i++) 
            this.bits.push(null);
    }
}

class Media {
    constructor(dataArray) {
        this.connections;
        this.dataArray = dataArray;
    }
}

class Station {
    constructor(ipAddress) {
        this.ipAddress = ipAddress;
        console.log("(( CREATED A NEW MACHINE " + ipAddress + " ))");
    }

    assembleFrame(frameLengthBits) {
        let frame = new Frame(5);

        return frame;
    }

    isMediaIdle(media) {
        let isIdle = true;

        for (let i = 0, len = media.dataArray.length; i < len; i++) {
            isIdle = ( media.dataArray[i] ? false : true);
        }

        return isIdle;
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

class DHCPServer {
    constructor() {
        this.runningIPs = [];
    }

    assignNewIP() {
        let isUnique = true; 
        let newIP;
        do{
            isUnique = true;
            newIP = "192.168.72." + Math.floor(Math.random() * 256);
            for (let i = 0; i < this.runningIPs.length; i++) {
                if (newIP === this.runningIPs[i])
                    isUnique = false;
            }

        }while(!isUnique);

        this.runningIPs.push(newIP);
        return newIP;
    }
}

class Simulation {
    constructor(secsBetweenTimeSlots, media, DHCPServer, numStations) {
        this.timeSlotsSinceStart = 0;

        this.secsBetweenTimeSlots = secsBetweenTimeSlots;
        this.media = media;
        this.DHCPServer = DHCPServer;
        this.stations = [];
        this.numStations = numStations;

        this.simulationClock = undefined;

        this.startSimulation();
    };

    startSimulation() {
        console.log("== Simulation Started ==");
        console.log("// ASSIGNING IPs WITH DHCP SERVER \\");

        for (let i = 0; i < this.numStations; i++)
            this.createStation();

        this.simulationClock = setInterval(this.passTimeSlot.bind(this), this.secsBetweenTimeSlots);
    };

    createStation() {
        this.stations.push(new Station(this.DHCPServer.assignNewIP()));
    }

    assignIpAddresses() {
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
        console.log("-- Time slots since start -- (" + this.timeSlotsSinceStart + ")");
        console.log(this.media.dataArray);
        //this.media.updateDataArray();
    };
}

function runSimulation() {
    simulation = new Simulation(3000, new Media(new MediaDataArray(10)), new DHCPServer(), 5);

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
        console.log(simulation.stations[0].assembleFrame());
    });
}

//RUN SIMULATION IF WINDOW LOAD
window.onload = runSimulation;

