let CANVASPADDING = 20;

class GUIController{
    constructor(simulationTimeBetweenSlots, simulationCanvas){
        this.simulationCanvas = simulationCanvas;
        this.simulationCanvasCTX = this.simulationCanvas.getContext('2d');

        this.simulationCanvas.addEventListener('click', this.canvasClick.bind(this), false);


        this.mediaSlots = [];
        this.computerSlots = [];

        this.simulationTimeBetweenSlots = simulationTimeBetweenSlots;
    }

    startMediaSlots(mediumSize){
        console.log("started gui media slots");

        let mediumSlotWidth =  (this.simulationCanvas.width - CANVASPADDING*2)/mediumSize;
        let mediumSlotHeight = mediumSlotWidth;

        for(let i = 0; i < mediumSize; i++){

            //this.mediaSlots.push(new MediaSlot(0, {x: MEDIASLOTLEFTOFFSET + MEDIASLOTWIDTH + ( i * MEDIASLOTWIDTH), y: MEDIASLOTTOPOFFSET}, {width: MEDIASLOTWIDTH, height: MEDIASLOTHEIGHT}));

            this.mediaSlots.push(new MediaSlot(this.simulationCanvasCTX, 0, {x: CANVASPADDING + ( i * mediumSlotWidth), y:  this.simulationCanvas.height/2 - mediumSlotHeight/2}, {width: mediumSlotWidth, height: mediumSlotHeight}, i));

        }
    }

    addComputerSlot(worker, stationPosition){
        this.computerSlots.push(new ComputerSlot(this.simulationCanvasCTX, worker, stationPosition, {x: this.mediaSlots[stationPosition].position.x, y:  this.mediaSlots[stationPosition].position.y + (stationPosition%2 == 0 ? this.mediaSlots[stationPosition].size.height : -this.mediaSlots[stationPosition].size.height)}, {width: this.mediaSlots[stationPosition].size.width, height: this.mediaSlots[stationPosition].size.height}, "idle"));
    }

    clearContext(){
        this.simulationCanvasCTX.clearRect(0, 0, this.simulationCanvas.width, this.simulationCanvas.height);
    }

    refreshCanvasContext(newValues){


        this.simulationCanvasCTX.textAlign = "left";

        this.simulationCanvasCTX.fillStyle = "grey";
        this.simulationCanvasCTX.font = "30px Arial";
        this.simulationCanvasCTX.fillText("Tempo entre time-slots: "+this.simulationTimeBetweenSlots+"ms",10,50);
        
        for(let i = 0; i < this.mediaSlots.length; i++){
            this.mediaSlots[i].value = newValues[i];
            this.mediaSlots[i].draw();
        }

        for(let i = 0; i < this.computerSlots.length; i++){
            this.computerSlots[i].draw();
        }
    }

    controlMachineState(machineState, stationPosition, waitingTime){
        for(let i = 0; i < this.computerSlots.length; i++)
            if(this.computerSlots[i].stationPosition == stationPosition)
                this.computerSlots[i].changeMachineState(machineState,waitingTime);
    }

    canvasClick(evt){
        for(let i = 0; i < this.computerSlots.length; i++){
            if(evt.x>=this.computerSlots[i].button.position.x && evt.x<=this.computerSlots[i].button.position.x+this.computerSlots[i].button.size.width 
                && evt.y>=this.computerSlots[i].button.position.y && evt.y<=this.computerSlots[i].button.position.y+this.computerSlots[i].button.size.height)
                this.computerSlots[i].button.clicked();

        }

        for(let i = 0; i < this.mediaSlots.length; i++){
            if(evt.x>=this.mediaSlots[i].position.x && evt.x<=this.mediaSlots[i].position.x+this.mediaSlots[i].size.width 
                && evt.y>=this.mediaSlots[i].position.y && evt.y<=this.mediaSlots[i].position.y+this.mediaSlots[i].size.height)
                this.mediaSlots[i].clicked();

        }
    }
}

class MediaSlot{
    constructor(canvasCTX, value, position, size, slotNumber){
        this.canvasCTX = canvasCTX;
        this.value = value;
        this.position = position;
        this.size = size;
        this.slotNumber = slotNumber;
    }

    clicked(){
        simulation.createStation(this.slotNumber);
        simulation.passTimeSlot();
    }

    draw(){
        this.canvasCTX.beginPath();
        this.canvasCTX.rect(this.position.x, this.position.y, this.size.width, this.size.height);
        
        this.canvasCTX.strokeStyle = "#bbbbbb";
        if(this.value == 0){
            this.canvasCTX.fillStyle = "white";
        }else if(this.value == 1){
            this.canvasCTX.fillStyle = "#008800";
        }else if(this.value > 1 && this.value <= 5){
            this.canvasCTX.fillStyle = "#888800";
        }else if(this.value > 5){
            this.canvasCTX.fillStyle = "#880000";
        }
        

        this.canvasCTX.fill();
        this.canvasCTX.stroke();
    }
}

class ComputerSlot{
    constructor(canvasCTX, worker, stationPosition, position, size, machineState) {
        this.canvasCTX = canvasCTX;
        this.worker = worker;
        this.stationPosition = stationPosition;
        this.position = position;
        this.size = size;
        this.machineState = machineState;
        this.waitingTime = 0;
        this.button = new ComputerSlotButton(canvasCTX, worker, { x: position.x, y: position.y + (stationPosition % 2 == 0 ? size.height : -this.size.height / 3) }, { width: size.width, height: this.size.height / 3 });

        this.computerImage = new Image();
        //computerImage = computerImage.onload;
        this.computerImage.src = "http://www.icons101.com/icon_png/size_512/id_76551/Computer.png";
    }

    draw(){
        this.button.draw();

        this.canvasCTX.drawImage(this.computerImage, this.position.x, this.position.y, this.size.width, this.size.height);

        this.canvasCTX.fillStyle = "black";
        this.canvasCTX.font = "20px Arial";
        this.canvasCTX.textAlign = "center";
        
        this.canvasCTX.fillStyle = "grey";
        if(this.machineState == "waiting")
            this.canvasCTX.fillText(this.waitingTime, this.position.x + this.size.width/2, (this.stationPosition % 2 == 0 ? this.position.y + 2*this.size.height : this.position.y - this.size.height/2));


        this.canvasCTX.lineWidth=1;

        if(this.machineState == "idle"){
            this.canvasCTX.fillStyle = "brown";
        }else if(this.machineState == "sending"){
            this.canvasCTX.fillStyle = "green";
        }else if(this.machineState == "waiting"){
            this.canvasCTX.fillStyle = "yellow";
        }

        this.canvasCTX.fillText(this.machineState, this.position.x + this.size.width/2, (this.stationPosition % 2 == 0 ? (this.position.y + 2*this.size.height) +20 : (this.position.y - this.size.height/2) - 20));

    }

    changeMachineState(machineState, waitingTime){
        if(machineState == "doneSending")
            this.button.active = true;

        this.waitingTime = waitingTime;
        this.machineState = machineState;
    }
}

class ComputerSlotButton{
    constructor(canvasCTX, worker, position, size){
        this.canvasCTX = canvasCTX;
        this.worker = worker;
        this.position = position;
        this.size = size;
        this.active = true;
    }

    draw(){
        this.canvasCTX.beginPath();
        this.canvasCTX.rect(this.position.x, this.position.y, this.size.width, this.size.height);

        if(this.active)
            this.canvasCTX.fillStyle = '#00aa00';
        else
            this.canvasCTX.fillStyle = '#aaaaaa';  

        this.canvasCTX.fill();

    }

    clicked(){
        if(this.active){
            this.worker.postMessage({type: "injectSignal"});
            this.active = false;
            this.draw();
        }
    }
}