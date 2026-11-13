// ---------- Playlist ----------
// To use your own songs: put .mp3 files in a "songs" folder and change src to "songs/yourfile.mp3"
const songs = [
  { title: 'SoundHelix Song 1', artist: 'T. Schurger', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { title: 'SoundHelix Song 2', artist: 'T. Schurger', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { title: 'SoundHelix Song 3', artist: 'T. Schurger', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { title: 'SoundHelix Song 4', artist: 'T. Schurger', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
  { title: 'SoundHelix Song 5', artist: 'T. Schurger', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' }
];

// ---------- Elements ----------
const audio = document.getElementById('audio');
const $ = id => document.getElementById(id);
const titleEl = $('title'), artistEl = $('artist');
const playBtn = $('play'), prevBtn = $('prev'), nextBtn = $('next');
const shuffleBtn = $('shuffle'), repeatBtn = $('repeat');
const progress = $('progress'), currentEl = $('current'), durationEl = $('duration');
const volume = $('volume'), volLabel = $('volLabel'), muteBtn = $('mute');
const playlistEl = $('playlist'), disc = $('disc');

let index = 0;
let shuffle = false;
let autoplay = true;
let lastVolume = 0.7;

// ---------- Helpers ----------
const fmt = s => {
  if (!isFinite(s)) return '0:00';
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};
const fill = (input) => {
  const pct = ((input.value - input.min) / (input.max - input.min)) * 100;
  input.style.setProperty('--fill', pct + '%');
};

// ---------- Build playlist ----------
function renderPlaylist() {
  playlistEl.innerHTML = '';
  songs.forEach((s, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<div><div class="t">${s.title}</div><div class="a">${s.artist}</div></div><span class="d" id="d${i}">--:--</span>`;
    li.addEventListener('click', () => { loadSong(i); play(); });
    playlistEl.appendChild(li);

    // Read each song's length for the playlist
    const probe = new Audio();
    probe.preload = 'metadata';
    probe.src = s.src;
    probe.addEventListener('loadedmetadata', () => { $('d' + i).textContent = fmt(probe.duration); });
  });
}

// ---------- Load / play / pause ----------
function loadSong(i) {
  index = (i + songs.length) % songs.length;
  const s = songs[index];
  audio.src = s.src;
  titleEl.textContent = s.title;
  artistEl.textContent = s.artist;
  document.title = `${s.title} - Music Player`;
  progress.value = 0; fill(progress);
  currentEl.textContent = '0:00';
  durationEl.textContent = '0:00';
  [...playlistEl.children].forEach((li, n) => li.classList.toggle('active', n === index));
}

function play() {
  audio.play().catch(() => {
    titleEl.textContent = 'Could not play this song';
    artistEl.textContent = 'Check your internet or the file path';
  });
}
const pause = () => audio.pause();
const togglePlay = () => (audio.paused ? play() : pause());

function nextSong() {
  if (shuffle && songs.length > 1) {
    let r;
    do { r = Math.floor(Math.random() * songs.length); } while (r === index);
    loadSong(r);
  } else {
    loadSong(index + 1);
  }
  play();
}
function prevSong() {
  // Like most players: restart the song if more than 3 seconds in
  if (audio.currentTime > 3) { audio.currentTime = 0; return; }
  loadSong(index - 1);
  play();
}

// ---------- Audio events ----------
audio.addEventListener('play', () => {
  playBtn.innerHTML = '&#10074;&#10074;';
  playBtn.setAttribute('aria-label', 'Pause');
  disc.classList.add('playing');
});
audio.addEventListener('pause', () => {
  playBtn.innerHTML = '&#9654;&#xFE0E;';
  playBtn.setAttribute('aria-label', 'Play');
  disc.classList.remove('playing');
});
audio.addEventListener('loadedmetadata', () => { durationEl.textContent = fmt(audio.duration); });
audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  progress.value = (audio.currentTime / audio.duration) * 100;
  fill(progress);
  currentEl.textContent = fmt(audio.currentTime);
});
audio.addEventListener('ended', () => {
  if (autoplay) nextSong();
  else { audio.currentTime = 0; pause(); }
});

// ---------- Progress bar (seek) ----------
progress.addEventListener('input', () => {
  if (audio.duration) audio.currentTime = (progress.value / 100) * audio.duration;
  fill(progress);
});

// ---------- Volume ----------
function setVolume(v) {
  audio.volume = Math.min(1, Math.max(0, v));
  volume.value = audio.volume;
  volLabel.textContent = Math.round(audio.volume * 100) + '%';
  muteBtn.innerHTML = audio.volume === 0 ? '&#128263;&#xFE0E;' : '&#128266;&#xFE0E;';
  fill(volume);
  if (audio.volume > 0) lastVolume = audio.volume;
}
volume.addEventListener('input', () => setVolume(+volume.value));
muteBtn.addEventListener('click', () => setVolume(audio.volume === 0 ? lastVolume : 0));

// ---------- Buttons ----------
playBtn.addEventListener('click', togglePlay);
nextBtn.addEventListener('click', nextSong);
prevBtn.addEventListener('click', prevSong);
shuffleBtn.addEventListener('click', () => {
  shuffle = !shuffle;
  shuffleBtn.setAttribute('aria-pressed', shuffle);
});
repeatBtn.addEventListener('click', () => {
  autoplay = !autoplay;
  repeatBtn.setAttribute('aria-pressed', autoplay);
});

// ---------- Keyboard shortcuts ----------
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' && e.target.type !== 'range') return;
  if (e.code === 'Space' && e.target.tagName !== 'BUTTON') { e.preventDefault(); togglePlay(); }
  if (e.code === 'ArrowRight' && e.shiftKey) nextSong();
  if (e.code === 'ArrowLeft' && e.shiftKey) prevSong();
  if (e.code === 'ArrowUp') { e.preventDefault(); setVolume(audio.volume + 0.05); }
  if (e.code === 'ArrowDown') { e.preventDefault(); setVolume(audio.volume - 0.05); }
});

// ---------- Start ----------
renderPlaylist();
loadSong(0);
setVolume(0.7);
