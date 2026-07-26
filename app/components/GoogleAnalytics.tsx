export function GoogleAnalytics({ measurementId }: { measurementId: string }) {
  if (!/^G-[A-Z0-9]+$/i.test(measurementId)) return null;
  const safeId = measurementId.replace(/[^A-Z0-9-]/gi, "");
  return (
    <>
      <script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${safeId}`}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',wait_for_update:500});gtag('js',new Date());gtag('config','${safeId}',{anonymize_ip:true});`,
        }}
      />
    </>
  );
}
