import { processIframe } from './injector';

export function initObserver() {
  // Process existing iframes
  const existingIframes = document.querySelectorAll<HTMLIFrameElement>('iframe[src*="youtube.com/embed"]');
  existingIframes.forEach(processIframe);

  // Observe for dynamically added iframes
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as Element;
            
            // Check if the added node itself is a youtube iframe
            if (el.tagName === 'IFRAME' && el.getAttribute('src')?.includes('youtube.com/embed')) {
              processIframe(el as HTMLIFrameElement);
            } else {
              // Check for nested iframes within the added node
              const nestedIframes = el.querySelectorAll<HTMLIFrameElement>('iframe[src*="youtube.com/embed"]');
              nestedIframes.forEach(processIframe);
            }
          }
        });
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}
