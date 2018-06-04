class Jam {
    constructor() {

    }
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