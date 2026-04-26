// This script runs INSIDE YouTube embed iframes in the MAIN world
// It has direct access to the YouTube player object

(function () {
  function getPlayer(): any {
    return (document.getElementById('movie_player') as any);
  }

  // Wait for the player to be ready
  function waitForPlayer(callback: (player: any) => void) {
    const player = getPlayer();
    if (player && typeof player.getPlaybackQuality === 'function') {
      callback(player);
    } else {
      setTimeout(() => waitForPlayer(callback), 500);
    }
  }

  waitForPlayer((player) => {
    // Listen for quality change requests from the parent page's content script
    window.addEventListener('message', (e) => {
      try {
        if (typeof e.data === 'object' && e.data.__ytuCommand) {
          const { command, args } = e.data;
          
          if (command === 'setQuality' && args?.quality) {
            const quality = args.quality;
            // Try multiple approaches
            if (typeof player.setPlaybackQualityRange === 'function') {
              player.setPlaybackQualityRange(quality, quality);
            }
            if (typeof player.setPlaybackQuality === 'function') {
              player.setPlaybackQuality(quality);
            }
          }

          if (command === 'getQualityLevels') {
            const levels = player.getAvailableQualityLevels?.() || [];
            const current = player.getPlaybackQuality?.() || 'auto';
            // Post back to parent
            window.parent.postMessage({
              __ytuResponse: true,
              type: 'qualityLevels',
              levels,
              current
            }, '*');
          }
        }
      } catch (err) {
        // Ignore errors
      }
    });

    // Periodically broadcast quality info back to the parent
    setInterval(() => {
      try {
        const levels = player.getAvailableQualityLevels?.() || [];
        const current = player.getPlaybackQuality?.() || 'auto';
        
        // Check CC state
        let ccEnabled = false;
        try {
          const track = player.getOption?.('captions', 'track');
          ccEnabled = !!(track && Object.keys(track).length > 0);
        } catch (e) {
          // Fallback if getOption fails
        }

        window.parent.postMessage({
          __ytuResponse: true,
          type: 'qualityInfo',
          levels,
          current,
          ccEnabled
        }, '*');
      } catch (err) {
        // Ignore
      }
    }, 2000);
  });
})();
