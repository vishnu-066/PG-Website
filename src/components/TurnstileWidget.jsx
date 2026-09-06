import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

const TURNSTILE_SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const DEFAULT_TEST_SITE_KEY = '1x00000000000000000000AA'; // Cloudflare official always-pass test key

const TurnstileWidget = forwardRef(({ 
  siteKey = import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY || DEFAULT_TEST_SITE_KEY,
  onSuccess,
  onError,
  onExpire,
  theme = 'auto',
  action = 'login'
}, ref) => {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);

  // Expose reset method to parent
  useImperativeHandle(ref, () => ({
    reset: () => {
      if (window.turnstile && widgetIdRef.current) {
        try {
          window.turnstile.reset(widgetIdRef.current);
        } catch (e) {
          console.warn('Failed to reset Turnstile widget:', e);
        }
      }
    }
  }));

  useEffect(() => {
    let isMounted = true;

    const renderWidget = () => {
      if (!isMounted || !containerRef.current || !window.turnstile) return;

      // Clean up previous widget if any
      if (widgetIdRef.current !== null) {
        try {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        } catch (e) {
          // ignore
        }
      }

      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: theme === 'auto' ? (document.documentElement.getAttribute('data-theme') || 'light') : theme,
          callback: (token) => {
            if (isMounted && onSuccess) onSuccess(token);
          },
          'error-callback': () => {
            if (isMounted && onError) onError();
          },
          'expired-callback': () => {
            if (isMounted && onExpire) onExpire();
          },
          action: action
        });
      } catch (err) {
        console.warn('Error rendering Turnstile:', err);
      }
    };

    // Check if Turnstile script is already loaded
    if (window.turnstile) {
      renderWidget();
    } else {
      // Load script if not already present
      let script = document.querySelector(`script[src="${TURNSTILE_SCRIPT_URL}"]`);
      if (!script) {
        script = document.createElement('script');
        script.src = TURNSTILE_SCRIPT_URL;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }

      const prevOnload = script.onload;
      script.onload = () => {
        if (typeof prevOnload === 'function') prevOnload();
        if (isMounted) renderWidget();
      };
    }

    return () => {
      isMounted = false;
      if (window.turnstile && widgetIdRef.current !== null) {
        try {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        } catch (e) {
          // ignore
        }
      }
    };
  }, [siteKey, theme, action]);

  return (
    <div className="turnstile-wrapper" style={{ display: 'flex', justifyContent: 'center', margin: '14px 0' }}>
      <div ref={containerRef} className="cf-turnstile" />
    </div>
  );
});

TurnstileWidget.displayName = 'TurnstileWidget';

export default TurnstileWidget;
