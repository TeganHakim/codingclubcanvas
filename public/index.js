const socket = io();
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext('2d');

const stroke = {
    point0: {x: 0, y: 0},
    point1: {x: 0, y: 0},
    point2: {x: 0, y: 0},
    color: "black",
    width: 2,
};

var mouseDown = false;

socket.on('connect', ()=>{
    console.log("connected!");
});

socket.on('time', (time) => {
    document.getElementById("ping").innerHTML = "Ping: " + (Date.now() - time) + " miliseconds";
});

canvas.addEventListener("mousedown", (e) => {
    stroke.point1.x = e.pageX-canvas.offsetLeft;
    stroke.point1.y = e.pageY-canvas.offsetTop;
    stroke.point0.x = e.pageX-canvas.offsetLeft;
    stroke.point0.y = e.pageY-canvas.offsetTop;

    mouseDown = true;
});

canvas.addEventListener("mouseup", (e) => {
    mouseDown = false;
});

canvas.addEventListener("mousemove", (e) => {
    stroke.point2.x = e.pageX-canvas.offsetLeft;
    stroke.point2.y = e.pageY-canvas.offsetTop;
    if(mouseDown) socket.emit('position', stroke);
    stroke.point0.x = stroke.point2.x;
    stroke.point0.y = stroke.point2.y;
    stroke.point1.x = e.pageX-canvas.offsetLeft;
    stroke.point1.y = e.pageY-canvas.offsetTop;
});

socket.on('position', (position) =>{
    ctx.beginPath();
    ctx.moveTo(position.point1.x, position.point1.y);
    ctx.lineTo(position.point2.x, position.point2.y);
    ctx.moveTo(position.point0.x, position.point0.y);
    ctx.lineTo(position.point1.x, position.point1.y);
    ctx.strokeStyle = position.color;
    ctx.stroke();
    ctx.lineWidth = position.width;
    console.log("hello");
});

document.querySelectorAll(".color").forEach((div) => {
    div.addEventListener("click", (e) => {
        if(e.target.id == "eraser"){
            stroke.color = "white";
        }else{
            stroke.color = e.target.id;
        }
        e.target.classList.add("color-selected"); 
        document.querySelectorAll(".color").forEach((div_2) => {
            if(div_2 !== e.target){
                div_2.classList.remove("color-selected");
            }
        });
    });
});

document.querySelector("#width-slider").addEventListener("change", (e) => {
    stroke.width = e.target.value;
});

setInterval(() => {
    socket.emit('time', Date.now());
}, 1000);