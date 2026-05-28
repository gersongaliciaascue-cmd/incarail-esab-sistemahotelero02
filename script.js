import * as THREE from 'three';  
  
// 1. Llama 3D con Three.js  
const scene = new THREE.Scene();  
const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);  
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('llama3d'), alpha: true });  
renderer.setSize(300, 300);  
const geometry = new THREE.SphereGeometry(1, 32, 32); // Llama simple por ahora  
const material = new THREE.MeshBasicMaterial({ color: 0xf5e6c8 });  
const llama = new THREE.Mesh(geometry, material);  
scene.add(llama);  
camera.position.z = 3;  
function animate() {  
  requestAnimationFrame(animate);  
  llama.rotation.y += 0.01;  
  renderer.render(scene, camera);  
}  
animate();  
setTimeout(() => {  
  document.getElementById('loader-llama').style.display = 'none';  
  document.getElementById('app').classList.remove('hidden');  
  cargarData();  
}, 3000);  
  
// 2. Estado Global  
let reservas = [];  
const HABITACIONES = {  
  calicanto: ["5", "10", "11", "19", "21", "22", "23"],  
  andenes: ["34", "35", "38", "39"]  
};  
  
async function cargarData() {  
  reservas = await fetch('/api/data').then(r => r.json());  
}  
  
// 3. Abrir Vivienda -> Sobre pestaña habitaciones  
document.getElementById('btn-calicanto').onclick = () => abrirHabitaciones('calicanto');  
document.getElementById('btn-andenes').onclick = () => abrirHabitaciones('andenes');  
  
function abrirHabitaciones(vivienda) {  
  const modal = document.getElementById('modal-habitaciones');  
  let html = `<div class="modal-content"><h2>VIVIENDA ${vivienda.toUpperCase()}</h2><div class="grid-hab">`;  
  HABITACIONES[vivienda].forEach(hab => {  
    const habReservas = reservas.filter(r => r.vivienda === vivienda && r.habitacion === hab);  
    const sexo = habReservas[0]?.sexo;  
    const clase = sexo === 'M'? 'ocupada-M' : sexo === 'F'? 'ocupada-F' : '';  
    html += `<div class="card-hab ${clase}" onclick="abrirCamas('${vivienda}','${hab}')"><h3>HAB ${hab}</h3>`;  
    for(let c=1; c<=3; c++) {  
      const camaOcupada = habReservas.find(r => r.cama === c);  
      html += `<div class="cama ${camaOcupada? 'ocupada' : ''}">Cama ${c}</div>`;  
    }  
    html += `</div>`;  
  });  
  html += `</div><button onclick="cerrarModal('modal-habitaciones')">Cerrar</button></div>`;  
  modal.innerHTML = html;  
  modal.classList.remove('hidden');  
}  
  
window.abrirCamas = (vivienda, habitacion) => {  
  const modal = document.getElementById('modal-camas');  
  let html = `<div class="modal-content"><h2>HAB ${habitacion}</h2><div class="grid-hab">`;  
  for(let c=1; c<=3; c++) {  
    const camaOcupada = reservas.find(r => r.vivienda === vivienda && r.habitacion === habitacion && r.cama === c);  
    html += `<div class="cama ${camaOcupada? 'ocupada' : ''}" onclick="${camaOcupada? '' : `pedirDatos('${vivienda}','${habitacion}',${c})`}">Cama ${c} ${camaOcupada? 'OCUPADA' : 'DISPONIBLE'}</div>`;  
  }  
  html += `</div><button onclick="cerrarModal('modal-camas')">Atrás</button></div>`;  
  modal.innerHTML = html;  
  modal.classList.remove('hidden');  
}  
  
window.pedirDatos = (vivienda, habitacion, cama) => {  
  const modal = document.getElementById('modal-datos');  
  modal.innerHTML = `  
  <div class="modal-content">  
    <h2>Reservar HAB ${habitacion} Cama ${cama}</h2>  
    <div class="form-datos">  
      <input id="nombre" placeholder="Nombre Completo">  
      <select id="sexo"><option value="M">M - Masculino</option><option value="F">F - Femenino</option></select>  
      <input id="dni" placeholder="DNI">  
      <input id="dias" type="number" placeholder="Cuántos días se quedará">  
      <button onclick="guardarReserva('${vivienda}','${habitacion}',${cama})">GUARDAR</button>  
      <button onclick="cerrarModal('modal-datos')">Cancelar</button>  
    </div>  
  </div>`;  
  modal.classList.remove('hidden');  
  cerrarModal('modal-camas');  
}  
  
window.guardarReserva = async (vivienda, habitacion, cama) => {  
  const body = {  
    vivienda, habitacion, cama,  
    nombre: document.getElementById('nombre').value,  
    sexo: document.getElementById('sexo').value,  
    dni: document.getElementById('dni').value,  
    dias: document.getElementById('dias').value  
  };  
  const res = await fetch('/api/reservar', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });  
  if(res.ok) { alert('Guardado'); cerrarTodo(); cargarData().then(() => abrirHabitaciones(vivienda)); }  
  else { alert((await res.json()).error); }  
}  
  
// 4. Reportes con Pass  
document.getElementById('btn-reportes').onclick = () => {  
  const pass = prompt('Contraseña Admin:');  
  if(pass === 'incarail789') abrirReportes();  
  else alert('Incorrecta');  
}  
  
async function abrirReportes() {  
  await cargarData();  
  const modal = document.getElementById('modal-reportes');  
  let izq = '', der = '';  
  reservas.forEach(r => {  
    izq += `<p>${r.nombre} / ${r.vivienda.toUpperCase()} / HAB ${r.habitacion} - Cama ${r.cama} / ${r.dias} días</p>`;  
    der += `<p>${r.nombre} <button class="btn-liberar" onclick="liberar('${r._id}')">Liberar</button></p>`;  
  });  
  modal.innerHTML = `<div class="modal-content"><h2>REPORTES ADMIN</h2><div class="tabla-reportes"><div class="tabla-izq">${izq || 'Sin reservas'}</div><div class="tabla-der">${der || 'Sin reservas'}</div></div><button onclick="cerrarModal('modal-reportes')">Cerrar</button></div>`;  
  modal.classList.remove('hidden');  
}  
  
window.liberar = async (id) => {  
  await fetch('/api/liberar', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({id, pass: 'incarail789'}) });  
  cerrarModal('modal-reportes'); cargarData().then(abrirReportes);  
}  
  
window.cerrarModal = (id) => document.getElementById(id).classList.add('hidden');  
function cerrarTodo() { document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden')); }  
