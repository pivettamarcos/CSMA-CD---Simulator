let simulation;

class MediaDataArray {
    constructor() {

    }
}

class Media {
    constructor(dataArray) {
        this.connections;
        this.dataArray = dataArray;
    }
}

class Station {
    constructor() {

    }

    isMediaIdle(media) {
        let isIdle = true;

        for (var i = 0, len = media.dataArray.length; i < len; i++) {
            isIdle = ( media.dataArray[i] ? false : true);
        }

        return isIdle;
    }
}

class Frame {
    constructor(bitsArray) {
        this.bitsArray = bitsArray;
    }
}

class Simulation {
    constructor(secsBetweenTimeSlots, media, station) {
        this.timeSlotsSinceStart = 0;

        this.secsBetweenTimeSlots = secsBetweenTimeSlots;
        this.media = media;
        this.station = station;

        this.simulationClock = undefined;

        this.startSimulation();
    };

    startSimulation() {
        console.log("== Simulation Started ==");
        this.simulationClock = setInterval(this.passTimeSlot.bind(this), this.secsBetweenTimeSlots);
    };

    changeSecsBetweenTimeSlots(newSecsBetweenTimeSlots) {
        this.secsBetweenTimeSlots = newSecsBetweenTimeSlots;
        clearInterval(this.simulationClock);

        this.simulationClock = setInterval(this.passTimeSlot.bind(this), this.secsBetweenTimeSlots);
    }

    passTimeSlot() {
        this.timeSlotsSinceStart++;
        console.log("-- Time slots since start -- (" + this.timeSlotsSinceStart + ")");

        //this.media.updateDataArray();
    };
}

function runSimulation() {
    simulation = new Simulation(3000, new Media(), new Station());

    addEventListeners();
}

//ADD EVENT LISTENERS
function addEventListeners() {
    document.getElementById("buttonChangeSecsBetweenTimeSlots").addEventListener("click", () => {
        let inputText = document.getElementById("inputChangeSecsBetweenTimeSlots").value;

        console.log("** Changed seconds between time slots to (" + inputText +"s) **");
        simulation.changeSecsBetweenTimeSlots(document.getElementById("inputChangeSecsBetweenTimeSlots").value);
    });
}

//RUN SIMULATION IF WINDOW LOAD
window.onload = runSimulation;

