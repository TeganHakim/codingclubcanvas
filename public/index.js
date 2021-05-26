const socket = io();
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext('2d');
const rgb_input = document.getElementById('rgb-code');
// Variables
let previousColor;
let ClientX, ClientY, timeout;
let density = 50;
// Set width and height of canvas
ctx.canvas.width = window.innerWidth - window.innerWidth / 10 - 1;
ctx.canvas.height = window.innerHeight - window.innerHeight / 10;
ctx.fillStyle = "white";
ctx.fillRect(0, 0, canvas.width, canvas.height);

const stroke = {
    point0: {x: 0, y: 0},
    point1: {x: 0, y: 0},
    point2: {x: 0, y: 0},
    color: "black",
    width: document.querySelector("#width-slider").value,
    texture: "brush",
};

let mouseDown = false;

socket.on('connect', ()=>{
    console.log("connected!");
});

socket.on('time', (time) => {
    document.getElementById("ping").innerHTML = "Ping: " + (Date.now() - time) + " ms";
});

canvas.addEventListener("mousedown", (e) => {
    if (stroke.texture === "spray") {
        ctx.lineJoin = ctx.lineCap = 'round';
        ClientX = e.pageX - canvas.offsetLeft
        ClientY = e.pageY - canvas.offsetTop;
        timeout = setTimeout(function draw() {
            for (var i = density; i--; ) {
                var angle = getRandomFloat(0, Math.PI*2);
                var radius = getRandomFloat(0, stroke.width);
                ctx.fillStyle = stroke.color;
                ctx.fillRect(ClientX + radius * Math.cos(angle), ClientY + radius * Math.sin(angle), 1, 1);
            }
            if (!timeout) return;
            timeout = setTimeout(draw, 50);
        }, 50);
    }
    else {
        stroke.point1.x = e.pageX-canvas.offsetLeft;
        stroke.point1.y = e.pageY-canvas.offsetTop;
        stroke.point0.x = e.pageX-canvas.offsetLeft;
        stroke.point0.y = e.pageY-canvas.offsetTop;
        mouseDown = true;
    }     
});
canvas.addEventListener("mouseup", (e) => {
    if (stroke.texture === "spray") {
        clearTimeout(timeout);
    }
    else {
        mouseDown = false;
    }
});

canvas.addEventListener("mousemove", (e) => {
    if (stroke.texture === "spray") {
        ClientX = e.pageX - canvas.offsetLeft
        ClientY = e.pageY - canvas.offsetTop;
    }
    else {
        stroke.point2.x = e.pageX-canvas.offsetLeft;
        stroke.point2.y = e.pageY-canvas.offsetTop;
        if(mouseDown) socket.emit('position', stroke);
        stroke.point0.x = stroke.point2.x;
        stroke.point0.y = stroke.point2.y;
        stroke.point1.x = e.pageX-canvas.offsetLeft;
        stroke.point1.y = e.pageY-canvas.offsetTop;
    }
});

socket.on('position', (position) =>{
    if (stroke.texture === "brush" || stroke.texture === "spray") {
        ctx.shadowBlur = 0;
        ctx.shadowColor = '';
    }
    if (stroke.texture === "shadow") {
        ctx.shadowBlur = 10;
        ctx.shadowColor = stroke.color;       
    }
    ctx.lineWidth = position.width;
    ctx.beginPath();
    ctx.lineJoin = ctx.lineCap = 'round';
    ctx.moveTo(position.point1.x, position.point1.y);
    ctx.lineTo(position.point2.x, position.point2.y);
    ctx.moveTo(position.point0.x, position.point0.y);
    ctx.lineTo(position.point1.x, position.point1.y);
    ctx.strokeStyle = position.color;
    ctx.stroke();
});

document.querySelectorAll(".color").forEach((div) => {
    div.addEventListener("click", (e) => {
        stroke.color = e.target.id;
        rgb_input.value = stroke.color;
        document.documentElement.style.setProperty("--current-color", stroke.color);
        previousColor = stroke.color;
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

document.querySelectorAll(".tool-item").forEach((tool) => {
    tool.addEventListener('click', (e) => {
        if(e.target.id == "eraser"){
            stroke.color = "white";
            document.documentElement.style.setProperty("--current-color", stroke.color);
            rgb_input.value = "eraser";
        }else{
            stroke.color = document.documentElement.style.getPropertyValue("--current-color");
            if (stroke.color === "") stroke.color = "rgb(0,0,0)";
            if (stroke.color === "white") {
                if (previousColor) stroke.color = previousColor;
                else stroke.color = "rgb(0,0,0)";
            }    
            rgb_input.value = stroke.color;
            document.documentElement.style.setProperty("--current-color", stroke.color);
        }
        e.target.classList.add("tool-selected");
        document.querySelectorAll(".tool-item").forEach((tool_2) => {
            if(tool_2 !== e.target){
                tool_2.classList.remove("tool-selected");
            }
        });
    })
})

rgb_input.addEventListener("keyup", event => {
    if(event.key !== "Enter") return;
    stroke.color = rgb_input.value;
    document.documentElement.style.setProperty("--current-color", stroke.color);
    event.preventDefault();
});

document.querySelectorAll(".texture").forEach((texture) => {
    texture.addEventListener('click', (e) => {
        if (e.target.id === "brush") {
            stroke.texture = "brush";
        }
        else if (e.target.id === "shadow") {
            stroke.texture = "shadow";
        }
        else if (e.target.id === "spray") {
            stroke.texture = "spray";
        }
        e.target.classList.add("texture-selected"); 
        document.querySelectorAll(".texture").forEach((texture_2) => {
            if(texture_2 !== e.target){
                texture_2.classList.remove("texture-selected");
            }
        });
    })
});

setInterval(() => {
    socket.emit('time', Date.now());
}, 1000);


function DownloadCanvasImage() {
    let downloadLink = document.createElement('a');
    downloadLink.setAttribute('download', 'Canvas_drawing.png');
    let canvas = document.querySelector('#canvas');
    let dataUrl = canvas.toDataURL('image/png');
    let url = dataUrl.replace(/^data:image\/png/, 'data:application/octet-stream');
    downloadLink.setAttribute('href', url);
    downloadLink.click();
}

function getRandomFloat(min, max) {
    return Math.random() * (max - min) + min;
}