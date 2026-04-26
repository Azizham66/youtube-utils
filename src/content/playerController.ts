export class PlayerController {
  private iframe: HTMLIFrameElement;
  private origin: string = '*';
  
  public currentTime: number = 0;
  public playerState: number = -1; // -1: unstarted, 0: ended, 1: playing, 2: paused, 3: buffering, 5: cued
  
  public availableQualityLevels: string[] = [];
  public playbackQuality: string = '';
  public videoId: string = '';
  public ccEnabled: boolean = false;
  
  public onStateChange?: (state: number) => void;
  public onTimeUpdate?: (time: number) => void;
  public onQualityLevelsUpdate?: (levels: string[]) => void;
  public onPlaybackQualityChange?: (quality: string) => void;
  public onVideoDataUpdate?: (videoId: string) => void;
  public onCCChange?: (enabled: boolean) => void;

  constructor(iframe: HTMLIFrameElement) {
    this.iframe = iframe;
    this.initListener();
  }

  private initListener() {
    window.addEventListener('message', (e) => {
      if (e.source !== this.iframe.contentWindow) return;
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        
        // Handle responses from our embed_inject script
        if (data.__ytuResponse) {
          if (data.type === 'qualityInfo' || data.type === 'qualityLevels') {
            if (data.levels && data.levels.length > 0) {
              const levels = data.levels;
              if (levels.join(',') !== this.availableQualityLevels.join(',')) {
                this.availableQualityLevels = levels;
                this.onQualityLevelsUpdate?.(this.availableQualityLevels);
              }
            }
            if (data.current && this.playbackQuality !== data.current) {
              this.playbackQuality = data.current;
              this.onPlaybackQualityChange?.(this.playbackQuality);
            }
            if (data.ccEnabled !== undefined && this.ccEnabled !== data.ccEnabled) {
              this.ccEnabled = data.ccEnabled;
              this.onCCChange?.(this.ccEnabled);
            }
          }
          return;
        }
        
        if (data.event === 'infoDelivery' && data.info) {
          if (data.info.currentTime !== undefined) {
            this.currentTime = data.info.currentTime;
            this.onTimeUpdate?.(this.currentTime);
          }
          if (data.info.playerState !== undefined) {
            this.playerState = data.info.playerState;
            this.onStateChange?.(this.playerState);
          }
          if (data.info.videoData && data.info.videoData.video_id) {
            if (this.videoId !== data.info.videoData.video_id) {
              this.videoId = data.info.videoData.video_id;
              this.onVideoDataUpdate?.(this.videoId);
            }
          }
        }
      } catch (err) {
        // Ignore non-JSON messages
      }
    });

    // Tell the iframe we are listening to events
    if (this.iframe.contentWindow) {
      this.iframe.contentWindow.postMessage(JSON.stringify({event: 'listening'}), '*');
    }
  }

  private sendCommand(func: string, args?: any[]) {
    if (!this.iframe.contentWindow) return;
    
    const message = JSON.stringify({
      event: 'command',
      func: func,
      args: args || []
    });
    
    this.iframe.contentWindow.postMessage(message, this.origin);
  }

  play() {
    this.sendCommand('playVideo');
  }

  pause() {
    this.sendCommand('pauseVideo');
  }

  togglePlay(isPlaying: boolean) {
    if (isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  setPlaybackRate(rate: number) {
    this.sendCommand('setPlaybackRate', [rate]);
  }

  seekBy(seconds: number) {
    this.seekTo(this.currentTime + seconds, true);
  }

  seekTo(seconds: number, allowSeekAhead: boolean = true) {
    this.sendCommand('seekTo', [seconds, allowSeekAhead]);
  }

  setVolume(volume: number) { // 0 to 100
    this.sendCommand('setVolume', [volume]);
  }

  mute() {
    this.sendCommand('mute');
  }

  unMute() {
    this.sendCommand('unMute');
  }

  setPlaybackQuality(quality: string) {
    // Use the embed_inject script for quality control (runs in MAIN world inside iframe)
    if (this.iframe.contentWindow) {
      this.iframe.contentWindow.postMessage({
        __ytuCommand: true,
        command: 'setQuality',
        args: { quality }
      }, '*');
    }
  }

  toggleCC(enable: boolean) {
    if (enable) {
      this.sendCommand('loadModule', ['captions']);
    } else {
      this.sendCommand('unloadModule', ['captions']);
    }
  }

  setCCLanguage(languageCode: string) {
    this.sendCommand('setOption', ['captions', 'track', { languageCode }]);
  }
}
