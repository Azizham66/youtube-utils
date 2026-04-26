export interface StorageData {
  playbackSpeed: number;
}

const DEFAULT_DATA: StorageData = {
  playbackSpeed: 1,
};

let cachedData: StorageData = { ...DEFAULT_DATA };
let currentDomain = '';

export async function initStorage() {
  currentDomain = window.location.hostname;
  return new Promise<void>((resolve) => {
    chrome.storage.local.get([currentDomain], (result) => {
      if (result[currentDomain] && typeof result[currentDomain] === 'object') {
        cachedData = { ...DEFAULT_DATA, ...(result[currentDomain] as StorageData) };
      }
      resolve();
    });
  });
}

export function getPlaybackSpeed(): number {
  return cachedData.playbackSpeed;
}

export function setPlaybackSpeed(speed: number) {
  cachedData.playbackSpeed = speed;
  chrome.storage.local.set({
    [currentDomain]: cachedData,
  });
}
