 

const cena = new THREE.Scene();
cena.background = new THREE.Color(0x87ceeb);

const cam = new THREE.PerspectiveCamera( 75,  window.innerWidth / window.innerHeight, 0.1, 1000);

const render = new THREE.WebGLRenderer({ antialias: true });
render.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(render.domElement);

let pontuacao = 0;

const textoPontos = document.createElement("div");

textoPontos.innerText = "Pontos: 0";

textoPontos.style.position = "absolute";
textoPontos.style.top = "20px";
textoPontos.style.left = "20px";

textoPontos.style.color = "white";
textoPontos.style.fontSize = "30px";
textoPontos.style.fontFamily = "Arial";

document.body.appendChild(textoPontos);
 
const luzDir = new THREE.DirectionalLight(0xffffff, 1);
luzDir.position.set(10, 10, 5);
cena.add(luzDir);

cena.add(new THREE.AmbientLight(0xffffff, 0.4));


const piso = new THREE.Mesh( new THREE.PlaneGeometry(200, 200),new THREE.MeshPhongMaterial({ color: 0x228b22 }));

piso.rotation.x = -Math.PI / 2;
cena.add(piso);

const ParedeMaterial = new THREE.MeshPhongMaterial({color: "blue"});


const parede_N = new THREE.Mesh(new THREE.BoxGeometry(200,20,0), ParedeMaterial);
parede_N.position.set(0,5,-100)
cena.add(parede_N);

const parede_S = new THREE.Mesh(new THREE.BoxGeometry(200,20,0), ParedeMaterial);
parede_S.position.set(0,5,100)
cena.add(parede_S);

const parede_W = new THREE.Mesh(new THREE.BoxGeometry(2,20,200), ParedeMaterial);
parede_W.position.set(-100,5,0)
cena.add(parede_W);

const parede_E = new THREE.Mesh(new THREE.BoxGeometry(2,20,200), ParedeMaterial);
parede_E.position.set(100,5,0)
cena.add(parede_E);


const Pontos = []

for(let i = 0; i<10; i++){
  const blocos = new THREE.Mesh(new THREE.BoxGeometry(5,5,5), new THREE.MeshPhongMaterial({color: "orange"}))
  blocos.position.set(Math.random() * 180 - 90,1,Math.random() * 180 - 90)
  
  cena.add(blocos)
  Pontos.push(blocos)
}




const carro = new THREE.Group();
const baseCarro = new THREE.Mesh( new THREE.BoxGeometry(2, 1, 4), new THREE.MeshPhongMaterial({ color: 0xff0000 }));

baseCarro.position.y = 0.75;
carro.add(baseCarro);

const geoRoda = new THREE.CylinderGeometry(0.5, 0.5, 0.5, 32);
const matRoda = new THREE.MeshPhongMaterial({ color: 0x000000 });

function roda(px, pz) {
 const r = new THREE.Mesh(geoRoda, matRoda);
  r.rotation.z = Math.PI / 2;
  r.position.set(px, 0.25, pz);
  return r;
}

carro.add(roda(1, 1.5));
carro.add(roda(-1, 1.5));
carro.add(roda(1, -1.5));
carro.add(roda(-1, -1.5));

cena.add(carro);
const teclas = {};

window.addEventListener("keydown", e => {
  teclas[e.key.toLowerCase()] = true;
});

window.addEventListener("keyup", e => {
  teclas[e.key.toLowerCase()] = false;
});

cam.position.set(0, 5, 10);

const video = document.createElement("video");

video.autoplay = true;
video.playsInline = true;

video.style.position = "absolute";
video.style.right = "10px";
video.style.bottom = "10px";
video.style.width = "250px";

document.body.appendChild(video);

navigator.mediaDevices.getUserMedia({
  video: true
}).then(stream => {
  video.srcObject = stream;
});

let frente = false;
let esquerda = false;
let direita = false;
let re = false;

let detector;

async function iniciarMoveNet() {

  detector = await poseDetection.createDetector(
    poseDetection.SupportedModels.MoveNet
  );

  detectarPose();
}

async function detectarPose() {

  if (
    detector &&
    video.readyState >= 2
  ) {

    const poses =
      await detector.estimatePoses(video);

    frente = false;
    esquerda = false;
    direita = false;
    re = false;

    if (poses.length > 0) {

     const pose = poses[0];

      const ombroE = pose.keypoints[5];
      const ombroD = pose.keypoints[6];

      const punhoE = pose.keypoints[9];
      const punhoD = pose.keypoints[10];

    
      if (punhoD.score > 0.3 && ombroD.score > 0.3 && punhoD.y < ombroD.y) {
        direita = true;
      }

   
      if (punhoE.score > 0.3 &&  ombroE.score > 0.3 &&  punhoE.y < ombroE.y) {
        esquerda = true;
      }

    
      if (punhoD.score > 0.3 && ombroD.score > 0.3 && punhoD.x > ombroD.x + 100) {
        frente = true;
      }

     
      if (punhoE.score > 0.3 &&ombroE.score > 0.3 &&punhoE.x < ombroE.x - 100) {
        re = true;
      }
    }
  }

  requestAnimationFrame(detectarPose);
}

iniciarMoveNet();

function loop() {
  requestAnimationFrame(loop);

  let vel = 0.15;
  let giro = 0.03;

  if (teclas["a"] || esquerda){
  carro.rotation.y += giro;
}
else if (teclas["d"] || direita){
  carro.rotation.y -= giro;
}

  let dir = new THREE.Vector3();
  carro.getWorldDirection(dir);

  
  let POS_Teste = carro.position.clone();

if (teclas["s"] || re) {
  POS_Teste.add(dir.clone().multiplyScalar(vel));
}
else if (teclas["w"] || frente) {
  POS_Teste.add(dir.clone().multiplyScalar(-vel));
}

for (let i = Pontos.length - 1; i >= 0; i--) {

  const distancia = carro.position.distanceTo(
    Pontos[i].position
  );

  if (distancia < 3) {
    cena.remove(Pontos[i]);
    Pontos.splice(i, 1);
    pontuacao++;
    textoPontos.innerText =
   "Pontos: " + pontuacao;
  }
}
 
 
const limite = 97;
 
if (POS_Teste.x > -limite && POS_Teste.x < limite && POS_Teste.z > -limite && POS_Teste.z < limite) {
  carro.position.copy(POS_Teste);
}
  
  let desloc = new THREE.Vector3(0, 4, 8);
  let posCam = desloc.clone().applyMatrix4(carro.matrixWorld);

  cam.position.copy(posCam);
  cam.lookAt(carro.position);
 
  render.render(cena, cam);
}



loop();


window.addEventListener("resize", () => {
  cam.aspect = window.innerWidth / window.innerHeight;
  cam.updateProjectionMatrix();
  render.setSize(window.innerWidth, window.innerHeight);
});
