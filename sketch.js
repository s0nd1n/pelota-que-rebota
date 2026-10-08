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

// sistema de partículas: salen de la posición del mouse y viven 10 segundos
let particulas = [];
const vidaParticula = 10000;   // 10 segundos en milisegundos
const emisionPorFrame = 2;
const maxParticulas = 2000;
const maxFragmentos = 2800;       // tope total contando los fragmentos de explosión
const gravedadParticula = 0.1;    // hacen que caigan hacia el fondo
const rozamientoParticula = 0.98;

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
    background(236, 226, 185);   // crema claro (igual que el fondo del body) para que resalten los colores

    // partículas que emanan del cursor
    actualizarParticulas();

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

// una partícula independiente. Las normales viven 10 segundos; los fragmentos
// de una explosión son más pequeños, salen disparados y viven menos.
class Particula {
    constructor(x, y, esFragmento = false){
        this.x = x;
        this.y = y;
        this.esFragmento = esFragmento;
        this.explotada = false;

        if (esFragmento){
            const ang = random(TWO_PI);
            const fuerza = random(1.5, 4);
            this.vx = cos(ang) * fuerza;
            this.vy = sin(ang) * fuerza;
            this.tamano = random(1, 6);
            this.vida = random(400, 900);   // los fragmentos viven menos
        } else {
            this.vx = random(-2.5, 2.5);
            this.vy = random(-2.5, 0.5);
            this.tamano = random(2, 14);    // tamaños bien variados
            this.vida = vidaParticula;
        }

        this.color = color(random(80, 255), random(80, 255), random(80, 255));
        this.nacimiento = millis();
    }

    actualizar(){
        // los fragmentos de la explosión caen menos y se frenan antes
        const g = this.esFragmento ? gravedadParticula * 0.25 : gravedadParticula;
        const r = this.esFragmento ? 0.92 : rozamientoParticula;

        this.vy += g;                   // caen
        this.vx *= r;
        this.vy *= r;
        this.x += this.vx;
        this.y += this.vy;

        const mitad = this.tamano / 2;

        // al llegar al fondo del canvas se quedan reposando ahí
        if (this.y + mitad > height){
            this.y = height - mitad;
            this.vy = 0;
            this.vx *= 0.8;             // se frenan al tocar
        }

        // no se salen por los lados
        if (this.x < mitad){
            this.x = mitad;
            this.vx *= -0.5;
        } else if (this.x > width - mitad){
            this.x = width - mitad;
            this.vx *= -0.5;
        }
    }

    edad(){
        return millis() - this.nacimiento;
    }

    estaViva(){
        return this.edad() < this.vida;
    }

    // pequeña explosión: unos pocos fragmentos que salen hacia afuera
    explotar(){
        const cantidad = floor(random(5, 9));
        for (let i = 0; i < cantidad; i++){
            if (particulas.length >= maxFragmentos) return;
            particulas.push(new Particula(this.x, this.y, true));
        }
    }

    dibujar(){
        const restante = 1 - this.edad() / this.vida;   // 1 -> 0 a lo largo de la vida
        const c = this.color;
        noStroke();
        // se mantienen visibles y solo se desvanecen en el último tramo de su vida
        fill(red(c), green(c), blue(c), 255 * Math.min(1, restante * 4));
        circle(this.x, this.y, this.tamano);
    }
}

function actualizarParticulas(){
    // emitir desde la posición del mouse
    if (particulas.length < maxParticulas) {
        for (let i = 0; i < emisionPorFrame; i++){
            particulas.push(new Particula(mouseX, mouseY));
        }
    }

    // actualizar, dibujar y descartar las partículas que ya murieron
    for (let i = particulas.length - 1; i >= 0; i--){
        const p = particulas[i];
        p.actualizar();

        // al estar por morir, hace una pequeña explosión (los fragmentos no explotan)
        if (!p.esFragmento && !p.explotada && p.edad() / p.vida >= 0.8){
            p.explotada = true;
            p.explotar();
        }

        if (p.estaViva()){
            p.dibujar();
        } else {
            particulas.splice(i, 1);
        }
    }
}
