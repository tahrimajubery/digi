// script.js

const yearsContainer   = document.getElementById('years-container');
const monthsContainer  = document.getElementById('months-container');
const eventsContainer  = document.getElementById('events-container');
const mediaBackground  = document.getElementById('media-background');
const uploadForm       = document.getElementById('upload-form');
const homeButton       = document.getElementById('home-button');

// Lightbox globals
let lightboxOverlay = null;
let currentIdx = 0;

let eventData = {};

// INITIAL HIDE
monthsContainer.style.display = 'none';
eventsContainer.style.display = 'none';

// TOGGLE UPLOAD FORM & OVERLAY
function toggleUploadForm() {
  const showing = uploadForm.style.display === 'block';
  uploadForm.style.display = showing ? 'none' : 'block';
  if (!showing) {
    const overlay = document.createElement('div');
    overlay.className = 'form-overlay';
    overlay.onclick = toggleUploadForm;
    document.body.appendChild(overlay);
  } else {
    document.querySelector('.form-overlay')?.remove();
  }
}

// HANDLE NEW EVENT
function handleUpload() {
  const title       = document.getElementById('event-title').value.trim();
  const description = document.getElementById('event-description').value.trim();
  const files       = Array.from(document.getElementById('event-files').files);
  const introFile   = document.getElementById('event-intro-video').files[0];
  const year        = document.getElementById('event-year').value;
  const month       = document.getElementById('event-month').value;

  if (!title || files.length === 0) {
    return alert("Please enter a title and upload at least one file.");
  }

  const mediaURLs = files.map(f => URL.createObjectURL(f));
  const introURL  = introFile ? URL.createObjectURL(introFile) : null;
  const newEvent  = { title, description, intro: introURL, preview: mediaURLs[0], media: mediaURLs };

  eventData[year]       ??= {};
  eventData[year][month] ??= [];
  eventData[year][month].push(newEvent);

  document.getElementById('event-title').value       = '';
  document.getElementById('event-description').value = '';
  document.getElementById('event-files').value       = '';
  document.getElementById('event-intro-video').value = '';
  toggleUploadForm();

  renderYears();
  updateFloatingMedia();
  showNotification('Memory added successfully!');
}

// SIMPLE TOAST
function showNotification(msg) {
  const n = document.createElement('div');
  n.className = 'notification';
  n.textContent = msg;
  document.body.appendChild(n);
  setTimeout(() => n.classList.add('show'), 10);
  setTimeout(() => {
    n.classList.remove('show');
    setTimeout(() => n.remove(), 300);
  }, 3000);
}

// RENDER YEARS
function renderYears() {
  yearsContainer.innerHTML = '';
  monthsContainer.style.display = 'none';
  eventsContainer.style.display = 'none';
  eventsContainer.classList.remove('gallery-mode');
  document.body.classList.remove('gallery-active');
  monthsContainer.innerHTML = '';
  eventsContainer.innerHTML = '';

  const years = Object.keys(eventData).sort().reverse();
  if (!years.length) {
    eventsContainer.style.display = 'block';
    eventsContainer.innerHTML = `
      <div class="empty-state">
        <h2>Welcome to my album</h2>
        <p>Start by adding the first memory using the + button</p>
      </div>`;
    return;
  }

  years.forEach(year => {
    const btn = document.createElement('button');
    btn.textContent = year;
    btn.onclick = () => {
      yearsContainer.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      monthsContainer.style.display = 'flex';
      renderMonths(year);
    };
    yearsContainer.appendChild(btn);
  });
}

// RENDER MONTHS
function renderMonths(year) {
  monthsContainer.innerHTML = '';
  eventsContainer.innerHTML   = '';
  eventsContainer.style.display = 'none';
  eventsContainer.classList.remove('gallery-mode');
  document.body.classList.remove('gallery-active');

  const order  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const months = Object.keys(eventData[year] || {}).sort((a,b) => order.indexOf(a) - order.indexOf(b));

  if (!months.length) {
    eventsContainer.style.display = 'block';
    eventsContainer.innerHTML = `
      <div class="empty-state">
        <h3>No memories for ${year}</h3>
        <p>Click + to add your first memory</p>
      </div>`;
    return;
  }

  months.forEach(month => {
    const btn = document.createElement('button');
    btn.textContent = month;
    btn.onclick = () => {
      monthsContainer.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      eventsContainer.style.display = 'grid';
      renderEvents(year, month);
    };
    monthsContainer.appendChild(btn);
  });
}

// RENDER EVENTS
function renderEvents(year, month) {
  eventsContainer.classList.remove('gallery-mode');
  document.body.classList.remove('gallery-active');
  eventsContainer.innerHTML = '';

  const evs = eventData[year]?.[month] || [];
  if (!evs.length) {
    eventsContainer.innerHTML = `
      <div class="empty-state">
        <h3>No memories for ${month} ${year}</h3>
        <p>Add your first memory using the + button</p>
      </div>`;
    return;
  }

  const heading = document.createElement('h3');
  heading.className = 'month-year-heading';
  heading.textContent = `${month} ${year}`;
  eventsContainer.appendChild(heading);

  const grid = document.createElement('div');
  grid.className = 'events-grid';
  eventsContainer.appendChild(grid);

  evs.forEach(ev => {
    const cell = document.createElement('div');
    cell.className = 'event-preview';

    const img = document.createElement('img');
    img.src = ev.preview;
    img.alt = ev.title;
    img.onclick = () => showGallery(ev, year, month);

    const titleEl = document.createElement('div');
    titleEl.className = 'event-title';
    titleEl.textContent = ev.title;

    cell.append(img, titleEl);
    grid.appendChild(cell);
  });
}

// SHOW GALLERY
function showGallery(event, year, month) {
  document.body.classList.add('gallery-active');
  const scrollPos = window.scrollY;
  eventsContainer.innerHTML = '';
  eventsContainer.classList.add('gallery-mode');

  const h2 = document.createElement('h2');
  h2.textContent = event.title;
  eventsContainer.appendChild(h2);

  if (event.description) {
    const p = document.createElement('p');
    p.textContent = event.description;
    eventsContainer.appendChild(p);
  }

  const di = document.createElement('div');
  di.className = 'event-date';
  di.textContent = `${month} ${year}`;
  eventsContainer.appendChild(di);

  if (event.intro) {
    const introVid = document.createElement('video');
    introVid.src      = event.intro;
    introVid.controls = true;
    introVid.autoplay = true;
    introVid.muted    = true;
    introVid.loop     = true;
    introVid.className = 'gallery-intro';
    eventsContainer.appendChild(introVid);
  }

  // build gallery
  const gallery = document.createElement('div');
  gallery.className = 'gallery-container';
  event.media.forEach(url => {
    const ext = url.split('.').pop().toLowerCase();
    let el;
    if (['mp4','webm','ogg'].includes(ext)) {
      el = document.createElement('video');
      el.src       = url;
      el.autoplay  = true;
      el.loop      = true;
      el.muted     = true;
      el.setAttribute('playsinline','');
    } else {
      el = document.createElement('img');
      el.src       = url;
      el.loading   = 'lazy';
    }
    el.className = 'gallery-media';
    gallery.appendChild(el);
  });
  eventsContainer.appendChild(gallery);

  // ── LIGHTBOX SETUP ──
  const mediaEls = Array.from(gallery.querySelectorAll('.gallery-media'));
  mediaEls.forEach((el, idx) => {
    el.style.cursor = 'pointer';
    el.onclick = () => openLightbox(idx);
  });

  function openLightbox(idx) {
    currentIdx = idx;
    if (!lightboxOverlay) {
      lightboxOverlay = document.createElement('div');
      lightboxOverlay.id = 'lightbox-overlay';
      lightboxOverlay.innerHTML = `
        <button id="lightbox-close">×</button>
        <button id="lightbox-prev" class="lightbox-button">←</button>
        <div id="lightbox-content"></div>
        <button id="lightbox-next" class="lightbox-button">→</button>
      `;
      document.body.appendChild(lightboxOverlay);
      document.getElementById('lightbox-close').onclick = closeLightbox;
      document.getElementById('lightbox-prev').onclick = () => navigateLightbox(-1);
      document.getElementById('lightbox-next').onclick = () => navigateLightbox(1);
      document.addEventListener('keydown', handleLightboxKeys);
    }
    lightboxOverlay.style.display = 'flex';
    const content = lightboxOverlay.querySelector('#lightbox-content');
    content.innerHTML = '';
    const url = mediaEls[currentIdx].src;
    const ext = url.split('.').pop().toLowerCase();
    let el;
    if (['mp4','webm','ogg'].includes(ext)) {
      el = document.createElement('video');
      el.src = url;
      el.controls = true;
      el.autoplay = true;
      el.loop = true;
      el.muted = true;
    } else {
      el = document.createElement('img');
      el.src = url;
    }
    content.appendChild(el);
  }

  function closeLightbox() {
    if (lightboxOverlay) lightboxOverlay.style.display = 'none';
  }

  function navigateLightbox(dir) {
    openLightbox((currentIdx + dir + mediaEls.length) % mediaEls.length);
  }

  function handleLightboxKeys(e) {
    if (!lightboxOverlay || lightboxOverlay.style.display !== 'flex') return;
    if (e.key === 'ArrowRight') navigateLightbox(1);
    if (e.key === 'ArrowLeft') navigateLightbox(-1);
    if (e.key === 'Escape') closeLightbox();
  }

  // back button
  const backBtn = document.createElement('button');
  backBtn.className = 'back-button';
  backBtn.textContent = '↩';
  backBtn.onclick = () => {
    document.body.classList.remove('gallery-active');
    renderEvents(year, month);
    eventsContainer.classList.remove('gallery-mode');
    window.scrollTo(0, scrollPos);
  };
  eventsContainer.appendChild(backBtn);
  window.scrollTo(0,0);
}

// FLOATING MEDIA (4 rows)
function updateFloatingMedia() {
  mediaBackground.innerHTML = '';
  const all = [];
  Object.values(eventData).forEach(months =>
    Object.values(months).forEach(evArr =>
      evArr.forEach(e => all.push(...e.media))
    )
  );
  if (!all.length) return;

  const sample = all.sort(() => 0.5 - Math.random()).slice(0, 40);
  const rows   = [[], [], [], []];
  sample.forEach((m, i) => rows[i % 4].push(m));

  const speedClasses = ['slow','medium','fast','xfast'];
  rows.forEach((items, i) => {
    const extended = items.concat(items);
    const row      = document.createElement('div');
    row.className  = `media-row ${speedClasses[i]}`;

    extended.forEach(src => {
      const ext = src.split('.').pop().toLowerCase();
      let el;
      if (['mp4','webm','ogg'].includes(ext)) {
        el = document.createElement('video');
        el.src      = src;
        el.autoplay = true;
        el.loop     = true;
        el.muted    = true;
        el.setAttribute('playsinline','');
      } else {
        el = document.createElement('img');
        el.src = src;
      }
      row.appendChild(el);
    });

    mediaBackground.appendChild(row);
  });
}

// INJECT NOTIFICATION & OVERLAY STYLES
const style = document.createElement('style');
style.textContent = `
  .notification {
    position: fixed; top:20px; left:50%;
    transform: translateX(-50%);
    background: rgba(44,44,44,0.9);
    color: #e8e6e1;
    padding:12px 24px;
    border-radius:8px;
    opacity:0;
    transition: opacity 0.3s;
    z-index:40;
  }
  .notification.show { opacity:1; }
  .form-overlay {
    position:fixed; top:0; left:0;
    width:100%; height:100%;
    background:rgba(0,0,0,0.5);
    z-index:20;
  }
  .upload-form { z-index:30!important; }
`;
document.head.appendChild(style);

// INITIALIZE
updateFloatingMedia();
renderYears();
homeButton.addEventListener('click', () => {
  renderYears();
  updateFloatingMedia();
  document.body.classList.remove('gallery-active');
});
