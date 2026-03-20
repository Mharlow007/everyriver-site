/*
  YouTube carousel behavior for the EveryRiver home page.
  - Uses the existing .carousel markup pattern (prev/next buttons, .carousel-track, .slide).
  - Builds slides from window.ER_YOUTUBE_VIDEOS (see youtube-videos.js).
  - Auto-plays the active slide (muted) when the carousel is sufficiently in-viewport.
  - Pauses when it leaves the viewport, and when changing slides.
*/

(function () {
  const carouselRoot = document.querySelector('[data-youtube-carousel]');
  if (!carouselRoot) return;

  const track = carouselRoot.querySelector('.carousel-track');
  const prev = carouselRoot.querySelector('.carousel-btn.prev');
  const next = carouselRoot.querySelector('.carousel-btn.next');
  if (!track || !prev || !next) return;

  init();

  async function init() {
    const rawList = await getVideoList();
    const videos = rawList
      .map((v) => ({ raw: String(v || '').trim(), id: extractYouTubeId(String(v || '').trim()) }))
      .filter((v) => Boolean(v.id));

    if (!videos.length) {
      track.innerHTML =
        '<li class="slide" aria-current="true"><div class="youtube-carousel-empty" role="status">No videos configured yet.</div></li>';
      return;
    }

    track.innerHTML = videos
      .map((v, i) => {
        const dataSrc = buildEmbedUrl(v.id);
        const title = `YouTube video ${i + 1}`;
        return (
          '<li class="slide" aria-current="false">' +
          '<div class="youtube-embed-wrap">' +
          '<iframe class="youtube-embed" title="' +
          escapeHtml(title) +
          '" data-src="' +
          escapeHtml(dataSrc) +
          '" loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>' +
          '</div>' +
          '</li>'
        );
      })
      .join('');

    renderPreviewStrip(videos);

    const slides = Array.from(track.children);
    let index = Math.max(0, slides.length - 1); // latest (last item)
    slides.forEach((s, i) => {
      if (i === index) s.setAttribute('aria-current', 'true');
      else s.removeAttribute('aria-current');
    });
    syncPreviewState();

    let isInView = false;

    const ro = new ResizeObserver(() => adjustHeight());
    ro.observe(carouselRoot);

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isInView = Boolean(entry && entry.isIntersecting && entry.intersectionRatio >= 0.6);
        if (isInView) {
          maybePlayActive();
        } else {
          pauseAt(index);
        }
      },
      { threshold: [0, 0.6, 1] }
    );
    io.observe(carouselRoot);

    function setActive(i) {
      if (i === index) return;
      pauseAt(index);
      slides[index].removeAttribute('aria-current');
      slides[i].setAttribute('aria-current', 'true');
      index = i;
      syncPreviewState();
      ensureLoaded(index);
      adjustHeight();
      maybePlayActive();
    }

    function go(dir) {
      setActive((index + dir + slides.length) % slides.length);
    }

    prev.addEventListener('click', () => go(-1));
    next.addEventListener('click', () => go(1));
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
    });

    let sx = 0,
      dx = 0;
    track.addEventListener('touchstart', (e) => {
      sx = e.touches[0].clientX;
      dx = 0;
    });
    track.addEventListener('touchmove', (e) => {
      dx = e.touches[0].clientX - sx;
    });
    track.addEventListener('touchend', () => {
      if (Math.abs(dx) > 45) {
        go(dx > 0 ? -1 : 1);
      }
    });

    ensureLoaded(index);
    adjustHeight();
    maybePlayActive();

    function ensureLoaded(i) {
      const iframe = getIframe(i);
      if (!iframe) return;
      if (iframe.src) return;
      const src = iframe.getAttribute('data-src');
      if (src) iframe.src = src;
    }

    function maybePlayActive() {
      if (!isInView) return;
      playAt(index);
    }

    function getIframe(i) {
      return slides[i] ? slides[i].querySelector('iframe') : null;
    }

    function playAt(i) {
      ensureLoaded(i);
      const iframe = getIframe(i);
      if (!iframe || !iframe.contentWindow) return;
      ytCommand(iframe, 'mute');
      ytCommand(iframe, 'playVideo');
    }

    function pauseAt(i) {
      const iframe = getIframe(i);
      if (!iframe || !iframe.contentWindow) return;
      ytCommand(iframe, 'pauseVideo');
    }

    function adjustHeight() {
      carouselRoot.style.height = '';
    }

    function renderPreviewStrip(items) {
      const existing = carouselRoot.parentElement.querySelector('.youtube-preview-strip');
      if (existing) existing.remove();
      const previewStrip = document.createElement('div');
      previewStrip.className = 'youtube-preview-strip';
      previewStrip.setAttribute('aria-label', 'Video previews');
      previewStrip.innerHTML = items
        .map((item, i) => {
          const thumb = buildThumbnailUrl(item.id);
          const label = i === items.length - 1 ? `Latest video ${i + 1}` : `Video ${i + 1}`;
          return (
            '<button class="youtube-preview" type="button" data-video-index="' +
            i +
            '" aria-label="' +
            escapeHtml(label) +
            '">' +
            '<img src="' +
            escapeHtml(thumb) +
            '" alt="' +
            escapeHtml(label) +
            '" loading="lazy" />' +
            '</button>'
          );
        })
        .join('');

      carouselRoot.insertAdjacentElement('afterend', previewStrip);
      previewStrip.querySelectorAll('.youtube-preview').forEach((button) => {
        button.addEventListener('click', () => {
          const nextIndex = Number(button.getAttribute('data-video-index'));
          if (!Number.isNaN(nextIndex)) setActive(nextIndex);
        });
      });
    }

    function syncPreviewState() {
      const previews = carouselRoot.parentElement.querySelectorAll('.youtube-preview');
      previews.forEach((button, i) => {
        if (i === index) button.setAttribute('aria-current', 'true');
        else button.removeAttribute('aria-current');
      });
    }
  }

  async function getVideoList() {
    const globalList = Array.isArray(window.ER_YOUTUBE_VIDEOS) ? window.ER_YOUTUBE_VIDEOS : [];
    if (globalList.length) return globalList;

    try {
      const response = await fetch('assets/js/youtube-videos.js?v=20260320-3', { cache: 'no-store' });
      if (!response.ok) return [];
      const source = await response.text();
      return extractQuotedEntries(source);
    } catch {
      return [];
    }
  }

  function extractQuotedEntries(source) {
    const matches = source.match(/"([^"\\]*(\\.[^"\\]*)*)"|'([^'\\]*(\\.[^'\\]*)*)'/g) || [];
    return matches
      .map((match) => {
        const trimmed = match.trim();
        return trimmed.slice(1, -1);
      })
      .filter(Boolean);
  }

  function ytCommand(iframe, func) {
    try {
      iframe.contentWindow.postMessage(
        JSON.stringify({
          event: 'command',
          func,
          args: [],
        }),
        '*'
      );
    } catch {
      // ignore
    }
  }

  function buildEmbedUrl(videoId) {
    // enablejsapi=1 allows postMessage play/pause/mute.
    // mute=1 helps autoplay work in modern browsers.
    const params = new URLSearchParams({
      autoplay: '0',
      mute: '1',
      playsinline: '1',
      rel: '0',
      modestbranding: '1',
      controls: '1',
      enablejsapi: '1',
    });
    return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?${params.toString()}`;
  }

  function buildThumbnailUrl(videoId) {
    return `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`;
  }

  function extractYouTubeId(input) {
    if (!input) return '';

    // If it's already an 11-char ID (typical), accept it.
    const directId = input.match(/^[a-zA-Z0-9_-]{11}$/);
    if (directId) return directId[0];

    // Try URL parsing
    try {
      const url = new URL(input);
      const host = url.hostname.replace(/^www\./, '');

      // youtu.be/VIDEO_ID
      if (host === 'youtu.be') {
        const id = url.pathname.replace(/^\//, '').split('/')[0];
        return (id || '').match(/^[a-zA-Z0-9_-]{11}$/) ? id : '';
      }

      // youtube.com/watch?v=VIDEO_ID
      const v = url.searchParams.get('v');
      if (v && v.match(/^[a-zA-Z0-9_-]{11}$/)) return v;

      // youtube.com/shorts/VIDEO_ID
      const shorts = url.pathname.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
      if (shorts) return shorts[1];

      // youtube.com/embed/VIDEO_ID
      const embed = url.pathname.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
      if (embed) return embed[1];
    } catch {
      // Not a URL
    }

    return '';
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
})();
