let simulation;

class Medium {
    constructor(mediumSize) {
        this.mediumSize = mediumSize;
        this.sharedMediumBuffer = new SharedArrayBuffer(this.mediumSize);
    }

    initializeSharedArrayBuffer(){
        for(let i = 0; i < this.returnBufferView().length; i++){
            this.returnBufferView()[i] = 0;
        }
    }

    returnBufferView(){
        return new Int8Array(this.sharedMediumBuffer)
    }
}

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
    constructor(secsBetweenTimeSlots, mediumSize, MACGenerator) {
        this.GUIController = new GUIController(secsBetweenTimeSlots, document.getElementById("simulationCanvas"));

        this.timeSlotsSinceStart = 0;

        this.secsBetweenTimeSlots = secsBetweenTimeSlots;

        this.medium = new Medium(mediumSize);
        this.stations = new Array(mediumSize);

        console.log(this.stations);

        this.MACGenerator = MACGenerator;

        this.simulationClock = undefined;

        this.startSimulation();
    };

    startSimulation() {
        console.log("== Simulation Started ==");

        this.GUIController.startMediaSlots(this.medium.mediumSize);
        this.simulationClock = setInterval(this.passTimeSlot.bind(this), this.secsBetweenTimeSlots);
    };

    createStation(stationPosition) {
        let successfull = true;

        if(this.stations[stationPosition] === undefined && (stationPosition < this.medium.mediumSize) && (stationPosition >= 0) ){
            let newMAC = this.MACGenerator.assignNewMAC();
            if (newMAC) {
                let worker = new Worker('station.js');
                
                this.stations[stationPosition] = worker;

                this.GUIController.addComputerSlot(worker, stationPosition);

                worker.postMessage({type: "threadInitialization", information: {machineState: "idle", mediumArray: this.medium.sharedMediumBuffer, macAddress: newMAC, stationPosition: stationPosition}});

                worker.onmessage = (msg) => {
                    switch (msg.data.type) {
                        case 'machineState':
                            this.GUIController.controlMachineState(msg.data.information.machineState, msg.data.information.stationPosition);
                        break;
                    }
                }

            }else{
                console.log("xx NO MAC AVAILABLE xx");
            }
        }else{
            console.log("xx MEDIUM POSITION UNAVAILABLE xx");
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
        this.GUIController.simulationTimeBetweenSlots = newSecsBetweenTimeSlots;

        this.simulationClock = setInterval(this.passTimeSlot.bind(this), this.secsBetweenTimeSlots);
    }

    passTimeSlot() {
        this.GUIController.clearContext();
        this.GUIController.refreshCanvasContext(this.medium.returnBufferView());

        this.timeSlotsSinceStart++;


        /*let tempFinalMedium = new Array(8);
        for(let i = 0; i < tempFinalMedium.length; i++){
            tempFinalMedium[i] = this.medium.returnBufferView[i] + this.medium.returnBufferView[i];
        }*/

        console.log(this.medium.returnBufferView());

      //  this.medium.moveBits();

        for (let i = 0; i < this.stations.length; i++){
            if(this.stations[i]){
                this.stations[i].postMessage({type: "passTimeSlot", information: {}});
            }
        }
    };

    getMachineWithMAC(MAC) {
        for (let i = 0; i < this.stations.length; i++)
            if (this.stations[i].macAddress == MAC)
                return this.stations[i];
    }
}

function runSimulation(mediumSize) {
    simulation = new Simulation(3000, mediumSize, new MACGenerator());
}

//ADD EVENT LISTENERS
function addEventListeners() {
    document.getElementById("buttonStartSimulation").addEventListener("click", () => {
        console.log("a");
        let inputText = document.getElementById("inputMediumSize").value;
        runSimulation(parseInt(document.getElementById("inputMediumSize").value));
        document.getElementById("inputMediumSize").value = "";
    });

    document.getElementById("buttonChangeSecsBetweenTimeSlots").addEventListener("click", () => {
        let inputText = document.getElementById("inputChangeSecsBetweenTimeSlots").value;

        console.log("** Changed seconds between time slots to (" + inputText +"s) **");
        simulation.changeSecsBetweenTimeSlots(document.getElementById("inputChangeSecsBetweenTimeSlots").value);

        document.getElementById("inputChangeSecsBetweenTimeSlots").value = "";
    });

    document.getElementById("buttonAssembleFrame").addEventListener("click", () => {
        console.log("++ Assembling frame "+simulation.stations[0].assembleFrame());
    });

    document.getElementById("buttonCreateStation").addEventListener("click", () => {
        simulation.createStation(document.getElementById("inputStationPosition").value);

        document.getElementById("inputStationPosition").value = "";

    });

    document.getElementById("buttonInjectSignal").addEventListener("click", () => {
        simulation.stations[document.getElementById("inputStationEmitter").value].postMessage({type: "injectSignal"});

        document.getElementById("inputStationEmitter").value = "";

    });
}

window.onload = addEventListeners;
