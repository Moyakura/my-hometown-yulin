/* ==========================================================================
   魅力玉林 · 公共脚本
   由全部页面共用；多页加载后可长期命中缓存
   模块：1 工具 / 2 顶栏与菜单 / 3 锚点滚动 / 4 渐现 / 5 返回顶部
        6 图片灯箱 / 7 视频懒加载与全屏
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- 1. 工具 ---------- */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* ---------- 2. 顶栏与移动端菜单 ---------- */
  var topbar = $('.topbar');
  var nav = $('.nav');
  var navToggle = $('.nav-toggle');

  if (nav && navToggle) {
    function setNav(open) {
      nav.classList.toggle('open', open);
      navToggle.classList.toggle('is-open', open);
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute('aria-label', open ? '关闭导航菜单' : '打开导航菜单');
    }
    navToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      setNav(!nav.classList.contains('open'));
    });
    $$('.nav a').forEach(function (a) { a.addEventListener('click', function () { setNav(false); }); });
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('open') && !nav.contains(e.target) && !navToggle.contains(e.target)) setNav(false);
    });
    window.addEventListener('resize', function () { if (window.innerWidth > 900) setNav(false); });
  }

  /* ---------- 3. 同页锚点平滑滚动 ---------- */
  // 跨页链接带 #xxx 时交给浏览器原生跳转，这里只处理当前页内的锚点
  $$('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href');
      if (!id || id === '#') return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.pageYOffset - topbar.offsetHeight;
      try {
        window.scrollTo({ top: top, behavior: reduceMotion ? 'auto' : 'smooth' });
      } catch (err) {
        window.scrollTo(0, top);
      }
      if (nav && nav.classList.contains('open') && navToggle) {
        nav.classList.remove('open');
        navToggle.classList.remove('is-open');
      }
      if (history.replaceState) history.replaceState(null, '', id);
    });
  });

  /* ---------- 4. 滚动渐现 ---------- */
  if (hasIO) {
    var revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var idx = Array.prototype.filter.call(el.parentElement.children, function (c) {
          return c.classList.contains('reveal');
        }).indexOf(el);
        el.style.transitionDelay = Math.min(Math.max(idx, 0), 5) * 80 + 'ms';
        el.classList.add('in');
        obs.unobserve(el);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    $$('.reveal').forEach(function (el) { revealObserver.observe(el); });
  } else {
    $$('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- 5. 顶栏状态与返回顶部（rAF 节流） ---------- */
  var toTop = $('.to-top');
  var ticking = false;
  function onScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop;
    if (topbar) topbar.classList.toggle('scrolled', y > 20);
    if (toTop) toTop.classList.toggle('show', y > window.innerHeight * 0.7);
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();
  if (toTop) {
    toTop.addEventListener('click', function () {
      try {
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      } catch (err) {
        window.scrollTo(0, 0);
      }
    });
  }

  /* ---------- 6. 图片灯箱 ---------- */
  var lightbox = $('.lightbox');
  if (lightbox) {
    var lbImg = $('#lbImg');
    var lbTitle = $('#lbTitle');
    var lbDesc = $('#lbDesc');
    var lbCount = $('#lbCount');
    var galleries = [];
    var curGroup = 0;
    var curIndex = 0;

    $$('[data-images]').forEach(function (holder) {
      var group = (holder.dataset.images || '').split('|').filter(Boolean).map(function (src) {
        return {
          src: src.trim(),
          title: holder.dataset.title || '',
          desc: holder.dataset.desc || ''
        };
      });
      if (!group.length) return;
      var gid = galleries.length;
      galleries.push(group);

      // 主图 / 缩略图都可点击打开
      var triggers = $$('.spot-media, .zoom-in, [data-lb-open]', holder);
      if (!triggers.length) triggers = [holder];
      triggers.forEach(function (t) {
        t.addEventListener('click', function () {
          openLightbox(gid, Number(this.dataset.lbIndex || 0));
        });
      });
    });

    function render() {
      var item = galleries[curGroup][curIndex];
      lbImg.src = item.src;
      lbImg.alt = item.title ? item.title + '（大图）' : '玉林风光大图';
      lbTitle.textContent = item.title;
      lbDesc.textContent = item.desc;
      lbCount.textContent = (curIndex + 1) + ' / ' + galleries[curGroup].length;
    }
    function openLightbox(gid, index) {
      if (!galleries.length) return;
      curGroup = gid;
      curIndex = index || 0;
      render();
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function closeLightbox() {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
      lbImg.removeAttribute('src');
    }
    function step(delta) {
      if (!galleries.length) return;
      var len = galleries[curGroup].length;
      curIndex = (curIndex + delta + len) % len;
      render();
    }
    $('.lb-close').addEventListener('click', closeLightbox);
    $('.lb-prev').addEventListener('click', function (e) { e.stopPropagation(); step(-1); });
    $('.lb-next').addEventListener('click', function (e) { e.stopPropagation(); step(1); });
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox || e.target.classList.contains('lb-figure')) closeLightbox();
    });
    document.addEventListener('keydown', function (e) {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
    });
    var touchX = null;
    lightbox.addEventListener('touchstart', function (e) { touchX = e.changedTouches[0].clientX; }, { passive: true });
    lightbox.addEventListener('touchend', function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
      touchX = null;
    });
  }

  /* ---------- 7. 视频：懒加载 + 互斥播放 + 全屏 ---------- */
  var players = $$('.video-player');
  var allVideos = players.map(function (p) { return $('video', p); }).filter(Boolean);

  function pauseOthers(current) {
    allVideos.forEach(function (v) { if (v !== current && !v.paused) v.pause(); });
  }
  function tryPlay(video) {
    var p = video.play();
    if (p && p.catch) p.catch(function () { /* 忽略自动播放限制 */ });
  }

  // 懒加载：进入视口前 200px 才真正写入 src，首页不再一次性拉取视频元数据
  function loadVideo(video) {
    if (video.src) return;
    var src = video.getAttribute('data-src');
    if (!src) return;
    video.src = src;
  }
  if (hasIO) {
    var lazyVideoObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        loadVideo($('video', entry.target));
        obs.unobserve(entry.target);
      });
    }, { rootMargin: '200px 0px' });
    players.forEach(function (p) { lazyVideoObserver.observe(p); });
  } else {
    allVideos.forEach(loadVideo);
  }

  players.forEach(function (playerEl) {
    var video = $('video', playerEl);
    var btn = $('.play-btn', playerEl);
    if (!video) return;
    if (btn) {
      btn.addEventListener('click', function () {
        loadVideo(video);
        pauseOthers(video);
        tryPlay(video);
      });
    }
    video.addEventListener('play', function () { pauseOthers(video); playerEl.classList.add('playing'); });
    video.addEventListener('pause', function () { playerEl.classList.remove('playing'); });
    video.addEventListener('ended', function () { playerEl.classList.remove('playing'); });

    /* 全屏：优先原生 API，被限制时降级为影院模式 */
    function fsEl() {
      return document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement || null;
    }
    function enterNative() {
      try {
        var req = playerEl.requestFullscreen || playerEl.webkitRequestFullscreen || playerEl.webkitRequestFullScreen || playerEl.msRequestFullscreen;
        if (!req) {
          if (typeof video.webkitEnterFullscreen === 'function') { video.webkitEnterFullscreen(); return Promise.resolve(); }
          return Promise.reject();
        }
        var p = req.call(playerEl);
        return (p && p.then) ? p : Promise.resolve();
      } catch (e) { return Promise.reject(e); }
    }
    function exitNative() {
      var ex = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
      if (ex) ex.call(document);
    }
    function enterCinema() {
      playerEl.classList.add('cinema');
      document.body.classList.add('cinema-open');
      fsBtn.textContent = '退出全屏';
      loadVideo(video);
      tryPlay(video);
    }
    function exitCinema() {
      playerEl.classList.remove('cinema');
      document.body.classList.remove('cinema-open');
      fsBtn.textContent = '全屏';
    }
    function toggleFullscreen() {
      if (playerEl.classList.contains('cinema')) { exitCinema(); return; }
      if (fsEl() === playerEl) { exitNative(); return; }
      if (fsEl()) exitNative();
      loadVideo(video);
      enterNative().then(function () {
        fsBtn.textContent = '退出全屏';
      }).catch(function () {
        enterCinema();
      });
    }

    var fsBtn = document.createElement('button');
    fsBtn.type = 'button';
    fsBtn.className = 'fs-btn';
    fsBtn.textContent = '全屏';
    fsBtn.setAttribute('aria-label', '全屏播放');
    playerEl.appendChild(fsBtn);
    fsBtn.addEventListener('click', function (e) { e.stopPropagation(); toggleFullscreen(); });

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'cinema-close';
    closeBtn.textContent = '✕';
    closeBtn.setAttribute('aria-label', '退出全屏播放');
    playerEl.appendChild(closeBtn);
    closeBtn.addEventListener('click', function (e) { e.stopPropagation(); exitCinema(); });

    ['fullscreenchange', 'webkitfullscreenchange', 'msfullscreenchange'].forEach(function (evt) {
      document.addEventListener(evt, function () {
        fsBtn.textContent = (fsEl() === playerEl) ? '退出全屏' : '全屏';
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && playerEl.classList.contains('cinema')) exitCinema();
    });
  });
})();
