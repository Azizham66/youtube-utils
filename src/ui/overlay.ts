import { PlayerController } from '../content/playerController';
import { getPlaybackSpeed, setPlaybackSpeed, getVolumeLevel, setVolumeLevel } from '../utils/storage';
import './styles.css';

const icons = {
  settings: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`,
  chevronDown: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`,
  play: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg>`,
  pause: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`,
  rewind: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/></svg>`,
  fastForward: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/></svg>`,
  volumeOn: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`,
  volumeOff: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>`,
  copy: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
  cc: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect><path d="M9 14.5a3.5 3.5 0 0 1 0-5 3.5 3.5 0 0 1 0 5z"></path><path d="M16 14.5a3.5 3.5 0 0 1 0-5 3.5 3.5 0 0 1 0 5z"></path></svg>`
};

export function createOverlay(controller: PlayerController): HTMLElement {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.top = '10px';
  container.style.left = '10px';
  container.style.zIndex = '999999';
  
  // Minimal button
  const minimalBtn = document.createElement('button');
  minimalBtn.className = 'ytu-minimal-btn ytu-hidden';
  minimalBtn.innerHTML = icons.settings;
  
  // Main Overlay
  const overlay = document.createElement('div');
  overlay.className = 'ytu-overlay active';
  
  // Header
  const header = document.createElement('div');
  header.className = 'ytu-header';
  header.innerHTML = `<span>YT Embed Utilities</span>
    <div style="display:flex; gap:4px">
      <button class="ytu-btn icon-btn" id="ytu-copy" style="background:transparent; padding:4px;" title="Copy Video URL">
        ${icons.copy}
      </button>
      <button class="ytu-btn icon-btn" id="ytu-minimize" style="background:transparent; padding:4px;" title="Minimize">
        ${icons.chevronDown}
      </button>
    </div>`;
  
  // Playback Controls
  const playbackRow = document.createElement('div');
  playbackRow.className = 'ytu-row';
  
  const playBtn = document.createElement('button');
  playBtn.className = 'ytu-btn icon-btn';
  playBtn.innerHTML = icons.play;
  let isPlaying = false;

  controller.onStateChange = (state) => {
    isPlaying = state === 1; // 1 = playing
    playBtn.innerHTML = isPlaying ? icons.pause : icons.play;
  };

  playBtn.onclick = () => {
    controller.togglePlay(isPlaying);
  };

  const seekBackBtn = document.createElement('button');
  seekBackBtn.className = 'ytu-btn icon-btn';
  seekBackBtn.innerHTML = icons.rewind;
  seekBackBtn.onclick = () => controller.seekBy(-5);

  const seekFwdBtn = document.createElement('button');
  seekFwdBtn.className = 'ytu-btn icon-btn';
  seekFwdBtn.innerHTML = icons.fastForward;
  seekFwdBtn.onclick = () => controller.seekBy(5);

  playbackRow.appendChild(seekBackBtn);
  playbackRow.appendChild(playBtn);
  playbackRow.appendChild(seekFwdBtn);

  // Speed Controls
  const speedRow = document.createElement('div');
  speedRow.className = 'ytu-row';
  
  const speedContainer = document.createElement('div');
  speedContainer.className = 'ytu-slider-container';
  
  const speedLabel = document.createElement('div');
  speedLabel.className = 'ytu-slider-label';
  
  const initialSpeed = getPlaybackSpeed();
  
  const speedLabelName = document.createElement('span');
  speedLabelName.innerText = 'Speed';
  const speedLabelVal = document.createElement('span');
  speedLabelVal.className = 'ytu-speed-val';
  speedLabelVal.innerText = `${initialSpeed}x`;
  
  speedLabel.appendChild(speedLabelName);
  speedLabel.appendChild(speedLabelVal);
  
  const speedSlider = document.createElement('input');
  speedSlider.type = 'range';
  speedSlider.className = 'ytu-slider';
  speedSlider.min = '0.25';
  speedSlider.max = '4';
  speedSlider.step = '0.25';
  speedSlider.value = initialSpeed.toString();

  speedSlider.oninput = (e) => {
    const val = parseFloat((e.target as HTMLInputElement).value);
    speedLabelVal.innerText = `${val}x`;
    controller.setPlaybackRate(val);
    setPlaybackSpeed(val);
  };

  controller.onPlaybackRateChange = (rate) => {
    speedSlider.value = rate.toString();
    speedLabelVal.innerText = `${rate}x`;
    setPlaybackSpeed(rate);
  };

  // Set initial speed when injected
  setTimeout(() => controller.setPlaybackRate(initialSpeed), 1500);

  speedContainer.appendChild(speedLabel);
  speedContainer.appendChild(speedSlider);
  speedRow.appendChild(speedContainer);

  // Volume Controls
  const volRow = document.createElement('div');
  volRow.className = 'ytu-row';
  
  const muteBtn = document.createElement('button');
  muteBtn.className = 'ytu-btn icon-btn';
  muteBtn.innerHTML = icons.volumeOn;
  let isMuted = false;
  muteBtn.onclick = () => {
    if (isMuted) {
      controller.unMute();
      muteBtn.innerHTML = icons.volumeOn;
      volSlider.value = controller.volume.toString();
      volLabelVal.innerText = `${controller.volume}%`;
    } else {
      controller.mute();
      muteBtn.innerHTML = icons.volumeOff;
      volSlider.value = '0';
      volLabelVal.innerText = '0%';
    }
    isMuted = !isMuted;
  };

  const volContainer = document.createElement('div');
  volContainer.className = 'ytu-slider-container';
  
  const volLabel = document.createElement('div');
  volLabel.className = 'ytu-slider-label';
  const volLabelName = document.createElement('span');
  volLabelName.innerText = 'Volume';
  const volLabelVal = document.createElement('span');
  const initialVolume = getVolumeLevel();
  volLabelVal.innerText = `${initialVolume}%`;
  
  volLabel.appendChild(volLabelName);
  volLabel.appendChild(volLabelVal);
  
  const volSlider = document.createElement('input');
  volSlider.type = 'range';
  volSlider.className = 'ytu-slider';
  volSlider.min = '0';
  volSlider.max = '100';
  volSlider.step = '1';
  volSlider.value = initialVolume.toString();

  volSlider.oninput = (e) => {
    const val = parseInt((e.target as HTMLInputElement).value, 10);
    volLabelVal.innerText = `${val}%`;
    controller.setVolume(val);
    setVolumeLevel(val);
  };

  controller.onVolumeChange = (volume, muted) => {
    isMuted = muted;
    muteBtn.innerHTML = muted ? icons.volumeOff : icons.volumeOn;
    
    if (muted) {
      volSlider.value = '0';
      volLabelVal.innerText = '0%';
    } else {
      volSlider.value = volume.toString();
      volLabelVal.innerText = `${volume}%`;
    }
    
    // Also save it locally
    setVolumeLevel(volume);
  };

  // Set initial volume when injected
  setTimeout(() => controller.setVolume(initialVolume), 1500);

  volContainer.appendChild(volLabel);
  volContainer.appendChild(volSlider);
  
  volRow.appendChild(muteBtn);
  volRow.appendChild(volContainer);

  // Quality Controls
  const qualityRow = document.createElement('div');
  qualityRow.className = 'ytu-row';
  qualityRow.innerHTML = `<span style="font-size:11px; color:rgba(255,255,255,0.6);">Quality</span>`;
  
  const qualitySelect = document.createElement('select');
  qualitySelect.className = 'ytu-select';
  qualitySelect.innerHTML = `<option value="auto">Auto</option>`;
  qualitySelect.onchange = (e) => {
    controller.setPlaybackQuality((e.target as HTMLSelectElement).value);
  };
  
  controller.onQualityLevelsUpdate = (levels) => {
    qualitySelect.innerHTML = '';
    levels.forEach(level => {
      const option = document.createElement('option');
      option.value = level;
      
      let label = level;
      if (level === 'auto') {
        label = 'Auto';
      } else if (level === 'hd2160') {
        label = '4K';
      } else if (level === 'hd1440') {
        label = '1440p';
      } else if (level === 'hd1080') {
        label = '1080p';
      } else if (level === 'hd720') {
        label = '720p';
      } else if (level === 'large') {
        label = '480p';
      } else if (level === 'medium') {
        label = '360p';
      } else if (level === 'small') {
        label = '240p';
      } else if (level === 'tiny') {
        label = '144p';
      } else {
        // Fallback for any other formats
        label = level.replace('hd', '');
        if (/\d$/.test(label)) label += 'p';
      }
      
      option.innerText = label;
      qualitySelect.appendChild(option);
    });
    qualitySelect.value = controller.playbackQuality || 'auto';
  };
  
  controller.onPlaybackQualityChange = (quality) => {
    qualitySelect.value = quality;
  };
  
  qualityRow.appendChild(qualitySelect);

  // CC Controls
  const ccRow = document.createElement('div');
  ccRow.className = 'ytu-row';
  
  const ccToggleBtn = document.createElement('button');
  ccToggleBtn.className = 'ytu-btn icon-btn';
  ccToggleBtn.innerHTML = icons.cc;
  ccToggleBtn.style.opacity = '0.5'; // default off
  ccToggleBtn.onclick = () => {
    controller.toggleCC(!controller.ccEnabled);
  };

  controller.onCCChange = (enabled) => {
    ccToggleBtn.style.opacity = enabled ? '1' : '0.5';
    ccToggleBtn.style.background = enabled ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)';
  };

  ccRow.appendChild(ccToggleBtn);

  // Assembly
  overlay.appendChild(header);
  overlay.appendChild(playbackRow);
  overlay.appendChild(speedRow);
  overlay.appendChild(volRow);
  overlay.appendChild(qualityRow);
  overlay.appendChild(ccRow);

  container.appendChild(minimalBtn);
  container.appendChild(overlay);

  // Copy Logic
  const copyBtn = header.querySelector('#ytu-copy') as HTMLElement;
  copyBtn.onclick = () => {
    if (controller.videoId) {
      navigator.clipboard.writeText(`https://youtu.be/${controller.videoId}`);
      const oldHtml = copyBtn.innerHTML;
      copyBtn.innerHTML = `<span style="font-size:10px">Copied!</span>`;
      setTimeout(() => copyBtn.innerHTML = oldHtml, 2000);
    }
  };

  // Minimize logic
  const minimizeBtn = header.querySelector('#ytu-minimize') as HTMLElement;
  minimizeBtn.onclick = () => {
    overlay.classList.add('ytu-hidden');
    minimalBtn.classList.remove('ytu-hidden');
  };

  minimalBtn.onclick = (e) => {
    if (isDragged) {
      e.preventDefault();
      return;
    }
    minimalBtn.classList.add('ytu-hidden');
    overlay.classList.remove('ytu-hidden');
  };

  // Draggable logic (simplified)
  let isDragging = false;
  let isDragged = false;
  let startY = 0;
  let startX = 0;
  let startTop = 0;
  let startLeft = 0;
  
  const onMouseDown = (e: MouseEvent) => {
    isDragging = true;
    isDragged = false;
    startY = e.clientY;
    startX = e.clientX;
    startTop = parseInt(container.style.top || '10', 10);
    startLeft = parseInt(container.style.left || '10', 10);
  };

  header.onmousedown = onMouseDown;
  minimalBtn.onmousedown = onMouseDown;

  document.onmousemove = (e) => {
    if (!isDragging) return;
    const dy = e.clientY - startY;
    const dx = e.clientX - startX;
    if (Math.abs(dy) > 3 || Math.abs(dx) > 3) {
      isDragged = true;
    }
    
    let newTop = startTop + dy;
    let newLeft = startLeft + dx;
    
    const parent = container.parentElement;
    if (parent) {
      const parentWidth = parent.offsetWidth;
      const parentHeight = parent.offsetHeight;
      const containerWidth = container.offsetWidth;
      const containerHeight = container.offsetHeight;
      
      if (newTop < 0) newTop = 0;
      if (newLeft < 0) newLeft = 0;
      if (parentHeight > 0 && newTop + containerHeight > parentHeight) newTop = parentHeight - containerHeight;
      if (parentWidth > 0 && newLeft + containerWidth > parentWidth) newLeft = parentWidth - containerWidth;
    }

    container.style.top = `${newTop}px`;
    container.style.left = `${newLeft}px`;
  };

  document.onmouseup = () => {
    isDragging = false;
  };

  return container;
}
