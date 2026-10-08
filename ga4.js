(function () {
  const MEASUREMENT_ID = 'G-G8XYDEWSY4';
  const TRACK_URL = 'https://vcokmkljwxuyiytiqtlc.supabase.co/functions/v1/shiten-track';

  const path = window.location.pathname;
  let shitenId = 'about';
  const match = path.match(/person([1-5])-shiten/i);
  if (match) shitenId = '0' + match[1];

  // First-party pageview log for access notifications.
  // Stores only page, path and referrer; no IP/user identifier is written to the database.
  try {
    fetch(TRACK_URL, {
      method: 'POST',
      mode: 'cors',
      keepalive: true,
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify({
        page: shitenId,
        path: window.location.pathname + window.location.search,
        referrer: document.referrer || null
      })
    }).catch(function(){});
  } catch (_) {}

  if (!/^G-[A-Z0-9]+$/i.test(MEASUREMENT_ID)) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function(){ dataLayer.push(arguments); };

  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(MEASUREMENT_ID);
  document.head.appendChild(s);

  gtag('js', new Date());
  gtag('config', MEASUREMENT_ID, {
    page_title: document.title,
    shiten_id: shitenId
  });
  gtag('event', 'shiten_view', {
    shiten_id: shitenId
  });
})();