/* oxlint-disable next/no-img-element -- Yandex requires a 1px noscript tracking image. */
'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';

const COUNTER_ID = 112324055;

export function YandexMetrika() {
  const pathname = usePathname();
  if (pathname.startsWith('/admin')) return null;
  return <>
    <Script id="yandex-metrika" strategy="afterInteractive">{`
      (function(m,e,t,r,i,k,a){
        m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
        m[i].l=1*new Date();
        for (var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}
        k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
      })(window,document,'script','https://mc.yandex.ru/metrika/tag.js?id=${COUNTER_ID}','ym');
      ym(${COUNTER_ID},'init',{ssr:true,webvisor:true,trackHash:true,clickmap:true,accurateTrackBounce:true,trackLinks:true});
    `}</Script>
    <noscript><div><img src={`https://mc.yandex.ru/watch/${COUNTER_ID}`} style={{ position: 'absolute', left: '-9999px' }} alt="" /></div></noscript>
  </>;
}
