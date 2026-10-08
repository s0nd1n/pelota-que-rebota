/*
este es un código
que hace que la pelota
rebote como si estuviera viva
*/

let posX, posY;
let velX, velY;
const radio = 25;
const gravedad = 0.5;
const velocidadMax = 30;
const radioPanico = radio + 80;  // distancia a la que la pelota se asusta del cursor

// squash & stretch
let deformacion = 0;   // 0..0.55: cuánto está aplastada/estirada
let deformDirX = 0;    // dirección hacia la superficie donde golpeó
let deformDirY = 1;

// color
let pelotaColor;

// sonido de rebote (p5.sound)
let bounceOsc, bounceEnv;

function setup(){
    createCanvas(windowWidth, windowHeight);
    posX = width / 2;
    posY = height / 4;
    velX = random(-5, 5);
    velY = 2;
    pelotaColor = color(random(80, 255), random(80, 255), random(80, 255));

    // el sonido se genera con un oscilador y una envolvente, sin archivos de audio
    bounceOsc = new p5.Oscillator('sine');
    bounceOsc.disconnect();
    bounceEnv = new p5.Envelope();
    bounceEnv.setADSR(0.002, 0.05, 0, 0.15);
    bounceOsc.connect(bounceEnv);
    bounceOsc.amp(0.4);
    bounceOsc.start();
}

function draw(){
    background(120);

    // la pelota escapa cuando el cursor se le acerca
    escaparDelCursor();

    posX += velX;
    posY += velY;
    velY += gravedad;

    // rebotes en los bordes de la pantalla
    if (posY + radio >= height) {        // suelo
        posY = height - radio;
        rebotar('y', 0, 1, abs(velY));
        velX += random(-2, 2);           // impulso horizontal impredecible
    } else if (posY - radio <= 0) {      // techo
        posY = radio;
        rebotar('y', 0, -1, abs(velY));
    }

    if (posX + radio >= width) {         // pared derecha
        posX = width - radio;
        rebotar('x', 1, 0, abs(velX));
    } else if (posX - radio <= 0) {      // pared izquierda
        posX = radio;
        rebotar('x', -1, 0, abs(velX));
    }

    velX = constrain(velX, -velocidadMax, velocidadMax);
    velY = constrain(velY, -velocidadMax, velocidadMax);

    // el squash & stretch vuelve poco a poco a la forma normal
    deformacion *= 0.8;
    if (deformacion < 0.01) deformacion = 0;

    dibujarPelota();
}

// la pelota huye del cursor: mientras más cerca, más rápido sale disparada
function escaparDelCursor(){
    const d = dist(mouseX, mouseY, posX, posY);
    if (d >= radioPanico) return;

    let dx = posX - mouseX;
    let dy = posY - mouseY;
    if (dx === 0 && dy === 0) {          // cursor justo encima: dirección al azar
        dx = random(-1, 1);
        dy = random(-1, 1);
    }

    const ang = atan2(dy, dx);
    const fuerza = map(d, 0, radioPanico, 3, 0.5);  // más cerca => más empuje
    velX += cos(ang) * fuerza;
    velY += sin(ang) * fuerza;
}

// invierte la velocidad con energía aleatoria: a veces rebota mucho, a veces poco
function rebotar(eje, dirX, dirY, impacto){
    // la restitución a veces es mayor que 1, así que algunos rebotes ganan energía
    const restitucion = random(0.75, 1.15);
    if (eje === 'x') {
        velX = -Math.sign(velX || 1) * impacto * restitucion;
    } else {
        velY = -Math.sign(velY || 1) * impacto * restitucion;
    }

    // squash & stretch: se aplasta en el eje del golpe
    deformacion = constrain(map(impacto, 1, velocidadMax, 0.15, 0.55), 0.15, 0.55);
    deformDirX = dirX;
    deformDirY = dirY;

    // cada rebote cambia a otro color
    cambiarColor();

    // solo suena si el golpe tiene fuerza suficiente, para no saturar de ruido
    if (impacto > 1) {
        playBounce(impacto);
    }
}

// elige un color nuevo lo más distinto posible al actual
function cambiarColor(){
    let nuevo = pelotaColor;
    let intentos = 0;
    do {
        nuevo = color(random(50, 255), random(50, 255), random(50, 255));
        intentos++;
    } while (intentos < 12 &&
        dist(red(nuevo), green(nuevo), blue(nuevo),
             red(pelotaColor), green(pelotaColor), blue(pelotaColor)) < 120);
    pelotaColor = nuevo;
}

function dibujarPelota(){
    push();
    translate(posX, posY);

    if (deformacion > 0) {
        // la parte que toca la superficie se queda pegada mientras se aplasta
        translate(deformDirX * radio * deformacion, deformDirY * radio * deformacion);
        if (deformDirY !== 0) {
            scale(1 + deformacion, 1 - deformacion);
        } else {
            scale(1 - deformacion, 1 + deformacion);
        }
    } else {
        // estiramiento según la velocidad (squash & stretch)
        const rapidez = sqrt(velX * velX + velY * velY);
        const estiron = constrain(rapidez / 60, 0, 0.3);
        rotate(atan2(velY, velX));
        scale(1 + estiron, 1 - estiron);
    }

    noStroke();
    fill(pelotaColor);
    circle(0, 0, radio * 2);
    pop();
}

function playBounce(impacto){
    const freq = map(constrain(impacto, 1, 15), 1, 15, 180, 600) + random(-40, 40);
    bounceOsc.freq(constrain(freq, 100, 900));
    bounceEnv.play();
}

// los navegadores requieren un gesto del usuario para habilitar el audio
function mousePressed(){
    userStartAudio();
}

function windowResized(){
    resizeCanvas(windowWidth, windowHeight);
}
