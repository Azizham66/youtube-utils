import { PlayerController } from './playerController';
import { createOverlay } from '../ui/overlay';
import { setupKeyboardShortcuts } from '../utils/keyboard';

export function processIframe(iframe: HTMLIFrameElement) {
  // Prevent duplicate injection
  if (iframe.dataset.ytEmbedInjected === 'true') {
    return;
  }

  const src = iframe.getAttribute('src');
  if (!src) return;

  // Check for enablejsapi=1
  if (!src.includes('enablejsapi=1')) {
    // Determine the correct separator for query params
    const separator = src.includes('?') ? '&' : '?';
    iframe.setAttribute('src', `${src}${separator}enablejsapi=1`);
    // After setting the src, the iframe will reload and trigger the observer again.
    // However, since we didn't set the dataset flag yet, it might process it multiple times
    // until the src actually updates. So we set the flag.
    iframe.dataset.ytEmbedInjected = 'true';
    // When it reloads, it will have the new src and the same element reference might stay or be replaced.
    // If it's the same element, we continue. If replaced, observer catches the new one.
    // To be safe, wait a moment for reload before injecting controls.
    setTimeout(() => injectControls(iframe), 1000);
  } else {
    iframe.dataset.ytEmbedInjected = 'true';
    injectControls(iframe);
  }
}

function injectControls(iframe: HTMLIFrameElement) {
  // Ensure the iframe has a parent
  const parent = iframe.parentElement;
  if (!parent) return;

  // Make parent relative if it's static to position the overlay correctly
  const parentStyle = window.getComputedStyle(parent);
  if (parentStyle.position === 'static') {
    parent.style.position = 'relative';
  }

  const controller = new PlayerController(iframe);
  const overlay = createOverlay(controller);
  
  // Position overlay top-right of the iframe bounds within the parent container
  // For simplicity, we can append it as a sibling to the iframe, and position absolute
  
  const wrapper = document.createElement('div');
  wrapper.className = 'yt-embed-utilities-wrapper';
  wrapper.style.position = 'absolute';
  wrapper.style.zIndex = '999999';
  
  // Update position based on iframe
  const updatePosition = () => {
    wrapper.style.top = `${iframe.offsetTop}px`;
    wrapper.style.left = `${iframe.offsetLeft}px`;
    wrapper.style.width = `${iframe.offsetWidth}px`;
    wrapper.style.height = `${iframe.offsetHeight}px`;
  };

  updatePosition();
  
  // Re-calc on resize
  window.addEventListener('resize', updatePosition);

  wrapper.appendChild(overlay);
  parent.appendChild(wrapper);

  // Setup keyboard shortcuts
  setupKeyboardShortcuts(controller, wrapper, iframe);
}
