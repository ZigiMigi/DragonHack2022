// connect to html
console.log("JavaScript is connected . . .")


// find and connect to canvas
var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

// load backgroud
let bgImg = new Image();
bgImg.src = './images/background_road_map.jpg';
ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);


// road detecting made with pixel findings (terible way...)
function circleOnRoad(width, height){
    // square around
    for (let i = width - 15; i < width + 15; i++) {
        for (let j = height - 15;j < height + 15; j++) {
            // every pixel inside the circle radius
            if (Math.sqrt((i - width) * (i - width) + (j - height) * (j - height)) < 15) {
                let tmp = ctx.getImageData(i, j, 1, 1).data;
                    if (tmp[0] == 255 && tmp[1] == 255 && tmp[2] == 255) {
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

    // if collision turn color to red and fill circle
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