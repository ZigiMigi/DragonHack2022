// connect to html
console.log("JavaScript is connected . . .")


// find and connect to canvas
var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

// load backgroud
let bgImg = new Image();
bgImg.src = './images/background.jpg';
ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);


// get random coordinates for the "road"
let y1 = Math.floor(Math.random() * 200) + 200;
let y2 = Math.floor(Math.random() * 200) + 200;

// draw road
function drawRoad() {
    ctx.beginPath();
    ctx.moveTo(0, y1);
    ctx.lineTo(1000, y2);
    ctx.stroke();
}

// circle to line collison detection
function pointCircleCollide(point, circle, r) {
    if (r === 0) {
        return false;
    }
    var dx = circle[0] - point[0];
    var dy = circle[1] - point[1];
    return dx * dx + dy * dy <= r * r;
}

var tmp = [0, 0]

function lineCircleCollide(a, b, circle, radius, nearest) {
    // check to see if start or end points lie within circle
    if (pointCircleCollide(a, circle, radius)) {
        if (nearest) {
            nearest[0] = a[0];
            nearest[1] = a[1];
        }
        return true;
    } if (pointCircleCollide(b, circle, radius)) {
        if (nearest) {
            nearest[0] = b[0];
            nearest[1] = b[1];
        }
        return true;
    }

    var x1 = a[0],
        y1 = a[1],
        x2 = b[0],
        y2 = b[1],
        cx = circle[0],
        cy = circle[1];

    // vector d
    var dx = x2 - x1;
    var dy = y2 - y1;

    // vector lc
    var lcx = cx - x1;
    var lcy = cy - y1;

    // project lc onto d, resulting in vector p
    var dLen2 = dx * dx + dy * dy;
    var px = dx;
    var py = dy;
    if (dLen2 > 0) {
        var dp = (lcx * dx + lcy * dy) / dLen2;
        px *= dp;
        py *= dp;
    }

    if (!nearest) {
        nearest = tmp;
    }
    nearest[0] = x1 + px;
    nearest[1] = y1 + py;

    // len2 of p
    var pLen2 = px * px + py * py;

    // check collision
    return pointCircleCollide(nearest, circle, radius)
            && pLen2 <= dLen2 && (px * dx + py * dy) >= 0;
}

// mouse move
function mousemove(event){
    // clear canvas and redraw road
    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
    drawRoad();

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // check collision for outer circle
    var hit1 = lineCircleCollide([0, y1], [1000, y2], [x, y], 25);
    // check collision for inner circle
    var hit2 = lineCircleCollide([0, y1], [1000, y2], [x, y], 50);
    
    ctx.fillStyle = "black";
    
    // set colors based on collisions
    if (hit2) {
        ctx.fillStyle = "orange";
        console.log("Animal is close . . .");
    }

    if (hit1) {
        ctx.fillStyle = "red";
        console.log("Animal is in danger zone ! ! !");
    }
    
    ctx.beginPath();
    ctx.arc(x, y, 50, 0, 2 * Math.PI);
    if (hit1 || hit2) {
        ctx.fill();
    }
    else {
        ctx.stroke();
    }
}


window.addEventListener('mousemove', mousemove);
