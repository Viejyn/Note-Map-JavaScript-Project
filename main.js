import { detectType, setStorage, detectIcon } from "./helpers.js";

//! html'den gelenler
const form = document.querySelector('form');
const list = document.querySelector('ul');

// Açılır/Kapanır özelliği için
const toggleButton = document.createElement('button');
toggleButton.textContent = 'Notlar';
toggleButton.id = 'toggleNotes';
toggleButton.style.position = 'fixed';
toggleButton.style.left = '50px';
toggleButton.style.top = '20px';
toggleButton.style.zIndex = '10001';
document.body.appendChild(toggleButton);

// Sidebar'ı seç
const sidebar = document.querySelector('.sidebar');

// Sidebar'ı aç/kapat
toggleButton.addEventListener('click', () => {
    sidebar.classList.toggle('open'); 
});

//! olay izleyicileri
form.addEventListener("submit", handleSubmit);
list.addEventListener("click", handleClick);

//! ortak kullanım alanı (global değişken tanımlama)
var map;
var notes = JSON.parse(localStorage.getItem('notes')) || [];
var coords = [];
var layerGroup = [];

//! kullanıcının konumunu öğrenme
navigator.geolocation.getCurrentPosition(
    loadMap,
    (error) => console.log('Konum alınamadı:', error)
);

// haritaya tıklanınca çalışan fonk.
function onMapClick(e) {
    form.style.display = 'flex';
    form.style.opacity = '0'; // Başlangıçta görünmez
    form.style.transition = 'opacity 0.3s ease'; 

    setTimeout(() => {
        form.style.opacity = '1'; // Görünür yap
    }, 10);

    coords = [e.latlng.lat, e.latlng.lng];
}

//! kullanıcının konumuna göre ekrana haritayı basma
function loadMap(e) {
    let lat = e?.coords?.latitude || 40.7128;
    let lng = e?.coords?.longitude || -74.0060;

    // haritanın kurulumunu yapar
    map = L.map('map').setView([lat, lng], 14);

    // haritanın nasıl görüneceğini belirler
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    // haritada ekrana basılacak imleçleri tutacağımız katman
    layerGroup = L.layerGroup().addTo(map);

    // local'den gelen notları listeleme
    renderNoteList(notes);

    // haritada bir tıklanma olduğunda çalışacak fonksiyon
    map.on('click', onMapClick);
}

// ekrana imleç basar
function renderMarker(item){
    // marker'ı oluşturur
    L.marker(item.coords,{ icon:detectIcon(item.status) })
    // imleçlerin olduğu katmana ekler
    .addTo(layerGroup)
    // üzerine tıklanınca açılacak popup ekleme
    .bindPopup(`${item.desc}`);
}

// formun gönderilmesi durumunda çalışır
function handleSubmit(e) {
    e.preventDefault();

    const desc = e.target[0].value;
    const date = e.target[1].value;
    const status = e.target[2].value;

    // notlar dizisine eleman ekleme
    notes.push({ 
        id: new Date().getTime(), 
        desc, 
        date, 
        status, 
        coords 
    });

    // local storage'i güncelleme
    setStorage(notes);

    // notları listeleme
    renderNoteList(notes);

    // formu kapatma
    form.style.opacity = '0';
    setTimeout(() => {
        form.style.display = 'none'; // Ekrandan kaldır
    }, 300); 
}

// ekrana notları basma fonksiyonu
function renderNoteList(items) {
    // note'lar alanını temizler
    list.innerHTML = '';
    // imleçleri temizler
    layerGroup.clearLayers();

    // her bir not için fonk. çalıştırır
    items.forEach((item) => {
        // li elemanı oluşturur
        const listEle = document.createElement('li');

        // data'sına sahip olduğu id'yi ekleme
        listEle.dataset.id = item.id;

        // içeriği belirleme
        listEle.innerHTML = `
               <div>
                  <p>${item.desc}</p>
                  <p><span>Tarih:</span> ${item.date}</p>
                  <p><span>Durum:</span> ${detectType(item.status)}</p>
               </div>
               <i id="fly" class="bi bi-airplane-engines-fill airplane-icon"></i>
               <i id="delete" class="bi bi-trash3-fill"></i>        
        `;
        // html'deki listeye elemanı ekleme
        list.insertAdjacentElement('afterbegin',listEle);

        // ekrana bas
        renderMarker(item);
    });
}

// notelar alanında tıklanma olayını izler
function handleClick(e) {
    // güncellenecek elemanın id'sini öğrenme
    const id = e.target.parentElement.dataset.id;
    if(e.target.id === 'delete') {
        // silinecek elemanın id'sini öğrenme
        const id = e.target.parentElement.dataset.id;

        // id'sini bildiğimiz elemanı diziden kaldırma
        notes = notes.filter((note) => note.id != id);

        // local'i güncelle
        setStorage(notes);

        // ekranı güncelleme
        renderNoteList(notes);
    }

    if (e.target.id === 'fly') {
        const note = notes.find((note) => note.id == id);

        map.flyTo(note.coords);
    }
}

