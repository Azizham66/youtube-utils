import { PlayerController } from '../content/playerController';
import { getPlaybackSpeed, setPlaybackSpeed } from './storage';

export function setupKeyboardShortcuts(controller: PlayerController, wrapper: HTMLElement, iframe: HTMLIFrameElement) {
  let isHovered = false;

  wrapper.addEventListener('mouseenter', () => isHovered = true);
  wrapper.addEventListener('mouseleave', () => isHovered = false);
  iframe.addEventListener('mouseenter', () => isHovered = true);
  iframe.addEventListener('mouseleave', () => isHovered = false);

  window.addEventListener('keydown', (e) => {
    // Only trigger if hovering over the iframe/wrapper or if it's currently focused
    const isFocused = document.activeElement === iframe || document.activeElement === wrapper;
    if (!isHovered && !isFocused) return;

    // Shift + Up/Down for speed
    if (e.shiftKey) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const current = getPlaybackSpeed();
        const next = Math.min(4, current + 0.25);
        controller.setPlaybackRate(next);
        setPlaybackSpeed(next);
        updateSpeedUI(wrapper, next);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const current = getPlaybackSpeed();
        const next = Math.max(0.25, current - 0.25);
        controller.setPlaybackRate(next);
        setPlaybackSpeed(next);
        updateSpeedUI(wrapper, next);
      }
    }

    // M for mute
    if (e.key.toLowerCase() === 'm') {
      // It's a toggle, but we don't know the exact current state.
      // We will assume a simple mute/unmute via controller isn't a strict toggle without state.
      // YouTube player API 'M' natively toggles it. So we might not even need to intercept if it has focus,
      // but if the wrapper is focused, we can't easily read state. 
      // We'll let the user click the button for visual sync, or we can add a toggleMute to controller.
      // For now, if we send 'mute' it might just mute it. 
      // Actually, if we want to toggle, we'd need state. We can keep it simple.
    }
  });
}

function updateSpeedUI(wrapper: HTMLElement, speed: number) {
  const label = wrapper.querySelector('.ytu-speed-val') as HTMLElement;
  if (label) label.innerText = `${speed}x`;
  
  const slider = wrapper.querySelector('.ytu-slider[max="4"]') as HTMLInputElement;
  if (slider) slider.value = speed.toString();
}
