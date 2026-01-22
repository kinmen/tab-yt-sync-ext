(() => {

  // const UG_PLAYBTN_SELECTOR_STR = 'button.Re4I7';
  const UG_PLAYBTN_SELECTOR_STR = 'button.JWQF_';
  const UG_PLAYBTN_PLAYING_CLASS = 'dLTUL'; // For UG UI where the 'playing' state is based on class change on btn element
  const UG_PLAYBTN_PLAYING_CHILD_SELECTOR = 'svg path[d="M8 3H4v14h4zm8 0h-4v14h4z"]'; // For UG UI where the 'playing' state is based on class change on btn element child nodes

  const SONGSTERR_PLAYBTN_SELECTOR_STR = 'button#control-play';
  const SONGSTERR_PLAYING_ATTRIBUTE = 'aria-pressed';


  /**
   * Check and set a global guard variable.
   * If this content script is injected into the same page again,
   * it will do nothing next time.
   */
  if (window.ugytHasRun) {
    return;
  }
  window.ugytHasRun = true;

  console.log('extension ug-yt run');

  let player;

  function embedYTVideo(YTVideoId) {
    if (player) {
      player.loadVideoById(YTVideoId);
    } else {
      player = new YT.Player('ytplayer', {
        height: '390',
        width: '640',
        videoId: YTVideoId,
        playerVars: {
          'playsinline': 1,
        },
        events: {
          'onReady': onPlayerReady,
          'onStateChange': onPlayerStateChange
        }
      });
    }
  }

  const elemDiv = document.createElement('div');
  elemDiv.setAttribute('id', 'ytplayer');
  elemDiv.style.position = 'fixed';
  elemDiv.style.bottom = '74px';
  elemDiv.style.zIndex = 56;
  document.body.appendChild(elemDiv);

  // Not really used rn since iframeapi code executed on page action popup open.
  function onYouTubeIframeAPIReady() {
    console.log('onytiframeapiready');
  }
  exportFunction(onYouTubeIframeAPIReady, window, { defineAs: 'onYouTubeIframeAPIReady' });

  function onPlayerReady(event) {
    console.log('on playerready ', event);
    const vid = event.target.options.videoId;
    const title = event.target.videoTitle;
    console.log('id, title', vid, title);
    const getHist = browser.storage.local.get('history');
    getHist.then(res => {
      let hist = res.history;
      console.log('hist', hist);
      
      if (!(hist)) {
        hist = {};
      }

      if (!(vid in hist)) {
        hist[vid] = title;
        browser.storage.local.set({history: hist});
      }
    });
  }

  function onPlayerStateChange(event) {
    console.log('onplayerstatecahge', event);
    console.log('state: ', event.data);
    if (event.data == YT.PlayerState.PLAYING && !ugIsPlaying()) {
      ugPlayBtn.click();
    } else if (event.data == YT.PlayerState.PAUSED && ugIsPlaying()) {
      ugPlayBtn.click();
    }
  }
  function stopVideo() {
    console.log('stop video called');
    player.stopVideo();
  }

  function waitForElm(selector) {
    return new Promise(resolve => {
      if (document.querySelector(selector)) {
        return resolve(document.querySelector(selector));
      }

      const observer = new MutationObserver(mutations => {
        if (document.querySelector(selector)) {
          observer.disconnect();
          resolve(document.querySelector(selector));
        }
      });

      // If you get "parameter 1 is not of type 'Node'" error, see https://stackoverflow.com/a/77855838/492336
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    });
  }

  let ugPlayBtn;
  function ugIsPlaying() {
    console.log('clist: ', ugPlayBtn.classList);
    return ugPlayBtn.classList.contains(UG_PLAYBTN_PLAYING_CLASS) 
    || ugPlayBtn.querySelector(UG_PLAYBTN_PLAYING_CHILD_SELECTOR)
    || ugPlayBtn.getAttribute(SONGSTERR_PLAYING_ATTRIBUTE) === "true";
  }

  function handleUGPlayClick() {
    // console.log('ug play clicked');

    if (ugIsPlaying() && player.getPlayerState() !== YT.PlayerState.PLAYING) {
      player.playVideo();
    } else if (!ugIsPlaying() && player.getPlayerState() == YT.PlayerState.PLAYING) {
      player.pauseVideo();
    }

  }

  waitForElm(`${UG_PLAYBTN_SELECTOR_STR},${SONGSTERR_PLAYBTN_SELECTOR_STR}`).then((elm) => {
    console.log('Element is ready');
    ugPlayBtn = elm;
    console.log(elm.textContent);

    const config = { attributes: true, childList: true, subtree: true, attributeOldValue: true };

    const mutationCb = (mutationList, observer) => {
      console.log('mutationlist:', mutationList);
      for (const mutation of mutationList) {
        // For UG UI where the 'playing' state is based on class change on btn element child nodes
        if (mutation.type === "childList" &&
          mutation.addedNodes.length &&
          mutation.addedNodes[0].tagName.toLowerCase() === "svg"
        ) {
          console.log("child node svg added.", mutation);
          console.log(mutation.addedNodes[0].tagName);
          handleUGPlayClick();

        // For UG UI where the 'playing' state is based on class change on btn element
        } else if (mutation.type === "attributes" &&
          mutation.attributeName === "class" &&
          mutation.oldValue !== mutation.target.className
        ) {
          console.log('attribute class mutation:', mutation);
          handleUGPlayClick();

        // For Songsterr UI where the 'playing' state is based on attribute aria-pressed change on btn element
        } else if (mutation.type === "attributes" &&
          mutation.attributeName === SONGSTERR_PLAYING_ATTRIBUTE &&
          mutation.oldValue !== mutation.target.getAttribute(SONGSTERR_PLAYING_ATTRIBUTE)
        ) {
          console.log('attribute songster playing mutation:', mutation);
          handleUGPlayClick();
        }
      }
    };

    const observer = new MutationObserver(mutationCb);
    observer.observe(ugPlayBtn, config);

  });

  /**
     * Listen for messages from the background script.
     */
  browser.runtime.onMessage.addListener((message) => {
    console.log('cs recieve msg:', message);
    if (message.command === "embedVideo") {
      embedYTVideo(message.videoId);
    }
  });
})();
