(function () {
  const MEASUREMENT_ID = 'G-G8XYDEWSY4';

  if (!/^G-[A-Z0-9]+$/i.test(MEASUREMENT_ID)) return;

  const path = window.location.pathname;
  let shitenId = 'about';
  const match = path.match(/person([1-5])-shiten/i);
  if (match) shitenId = '0' + match[1];

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