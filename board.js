var body = document.getElementsByTagName("body")[0];
var canvas = document.querySelector('canvas');
var ctx = canvas.getContext('2d');
var currentColor = document.querySelector('.colorpicker>input').value;
var currentSize = 5;
var posArray = [];
var isMouseDown = false; 


// listeners
document.querySelector('.colorpicker>input').addEventListener('input', colorChange, false);
document.querySelector('.downloadBtn').addEventListener('click', downloadImage, false);
document.querySelector('.eraseBtn').addEventListener('click', clearBoard, false);
canvas.addEventListener('mousedown', mousedown);
canvas.addEventListener('mousemove', mousemove);
canvas.addEventListener('mouseup', mouseup);

clearBoard();

function colorChange(event) {
    currentColor = event.target.value;
}

function downloadImage() {

    /* DEVELOPER MODE - USED TO CREATE TRAINING SIZE IMAGES (1/7th scale) */
    // var temp_cnvs = document.createElement('canvas');
    // var temp_cntx = temp_cnvs.getContext('2d');
    // temp_cnvs.width = 100; 
    // temp_cnvs.height = 64;
    // temp_cntx.fillStyle = 'white';
    // temp_cntx.fillRect(0, 0, 100, 64);
    // temp_cntx.drawImage(canvas, 0, 0, 700, 450, 0, 0, 100, 64);
    /***************************************************/

    let tempEle = document.createElement('a'), e;
    tempEle.download = "drawing.png";
    tempEle.href = temp_cnvs.toDataURL("image/png;base64");
    if (document.createEvent) {
        e = document.createEvent("MouseEvents");
        e.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        tempEle.dispatchEvent(e);
    } else if (tempEle.fireEvent) {
        tempEle.fireEvent("onclick");
    }
}

function clearBoard() {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 9999, 9999);
}

// mouse
function mousedown(event) {
    isMouseDown = true;
    const currentPosition = getMousePos(canvas, event);
    ctx.moveTo(currentPosition.x, currentPosition.y)
    ctx.beginPath();
    ctx.lineWidth  = currentSize;
    ctx.lineCap = "round";
    ctx.strokeStyle = currentColor;
}

function mousemove(event) {
    if (isMouseDown) {
        const currentPosition = getMousePos(canvas, event);
        ctx.lineTo(currentPosition.x, currentPosition.y)
        ctx.stroke();
        pushMousePos(currentPosition.x, currentPosition.y)
    }
}

function mouseup() {
    isMouseDown = false;
    pushMousePos();
}

function getMousePos(canvas, event) {
    const box = canvas.getBoundingClientRect();
    return {
        x: event.clientX - box.left,
        y: event.clientY - box.top
    };
}

function pushMousePos(x, y) {
    posArray.push({
        "x": x,
        "y": y,
        "size": currentSize,
        "color": currentColor
    });
}