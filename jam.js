
let jam;

class Jam {
    constructor(origin, bufferMedium) {
        this.origin = origin;
        this.bufferMedium = bufferMedium;

        this.leftSpread = 1;
        this.rightSpread = 1;

        this.doneReachEnd = [false, false];
    }

    passTimeSlot() {
        this.timeSlotsSinceStart++;

        this.spreadSignal(30);

    }

    spreadSignal(amp) {
        let doneSpreads = 0;
        let mediumSize = this.returnMediumBufferView().length;


        if ((this.origin - this.leftSpread) < 0) {
            this.doneReachEnd[0] = true;
            if (this.doneReachEnd[0] && this.doneReachEnd[1]) {
                if ((this.origin + (this.origin - this.leftSpread)) >= 0) {

                    this.returnMediumBufferView()[this.origin + (this.origin - this.leftSpread)] -= amp;

                    this.leftSpread++;
                } else {
                    doneSpreads++;
                }
            }
        } else {
            this.returnMediumBufferView()[this.origin - this.leftSpread] += amp;
            this.leftSpread++;
        }

        if ((this.origin + this.rightSpread) >= mediumSize) {
            this.doneReachEnd[1] = true;
            if (this.doneReachEnd[0] && this.doneReachEnd[1]) {
                if ((this.origin + ((this.origin + this.rightSpread) - mediumSize)) < mediumSize) {
                    this.returnMediumBufferView()[this.origin + ((this.origin + this.rightSpread) - mediumSize)] -= amp;
                    this.rightSpread++;
                } else {
                    doneSpreads++;
                }
            }
        } else {
            this.returnMediumBufferView()[this.origin + this.rightSpread] += amp;
            this.rightSpread++;
        }

        if (doneSpreads == 2)
            destroySelf();

    }

    returnMediumBufferView(bufferType) {
        return new Int8Array(this.bufferMedium)
    }
}



function destroySelf() {
    self.close();
}

self.onmessage = function (msg) {
    switch (msg.data.type) {
        case 'threadInitialization':
                jam = new Jam(msg.data.information.origin, msg.data.information.bufferMedium);
                jam.returnMediumBufferView()[msg.data.information.origin] += 30;
            break;
        case 'passTimeSlot':
                jam.passTimeSlot();
            break;
    }
}