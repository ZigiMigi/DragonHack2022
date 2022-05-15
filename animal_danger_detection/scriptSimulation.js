// connect to html
console.log("JavaScript is connected . . .")


// find and connect to canvas
var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

// load backgroud
let bgImg = new Image();
bgImg.src = './road.jpg';
ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

function circleOnRoad(width, height){
    // square around
    for (let i = width - 15; i < width + 15; i++) {
        for (let j = height - 15;j < height + 15; j++) {
            if (Math.sqrt((i - width) * (i - width) + (j - height) * (j - height)) < 15) {
                let tmp = ctx.getImageData(i, j, 1, 1).data;
                    if (tmp[0] == 0 && tmp[1] == 0 && tmp[2] == 0) {
                        console.log("COLLISION!!!")
                        return true;
                    }
            }
        }
    }
    return false;
}

// mouse move
function mousemove(event){
    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    ctx.fillStyle = "black";

    if (circleOnRoad(x, y)) {
        ctx.fillStyle = "red";
    }
    
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, 2 * Math.PI);
    if (circleOnRoad(x, y)) {
        ctx.fill();
    }
    else {
        ctx.stroke();
    }
    
}

window.addEventListener('mousemove', mousemove);