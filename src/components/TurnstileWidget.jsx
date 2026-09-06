import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

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
      try {
        if (typeof window !== 'undefined' && window.turnstile && widgetIdRef.current !== null) {
          window.turnstile.reset(widgetIdRef.current);
        }
      } catch (e) {
        console.warn('Failed to reset Turnstile widget:', e);
      }
    }
  }));

  useEffect(() => {
    let isMounted = true;
    let pollTimer = null;

    const renderWidget = () => {
      if (!isMounted || !containerRef.current || typeof window === 'undefined' || !window.turnstile) {
        return;
      }

      // Clean up previous widget if any
      if (widgetIdRef.current !== null) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {}
        widgetIdRef.current = null;
      }

      try {
        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: theme === 'auto' ? (document.documentElement.getAttribute('data-theme') || 'light') : theme,
          callback: (token) => {
            if (isMounted && onSuccess) {
              onSuccess(token);
            }
          },
          'error-callback': (errorCode) => {
            console.error('Cloudflare Turnstile error code:', errorCode);
            if (isMounted && onError) {
              onError(errorCode);
            }
          },
          'expired-callback': () => {
            if (isMounted && onExpire) {
              onExpire();
            }
          },
          action: action
        });
        widgetIdRef.current = id;
      } catch (err) {
        console.warn('Error rendering Turnstile:', err);
      }
    };

    // Safely check if window.turnstile is ready and has .render
    if (typeof window !== 'undefined' && window.turnstile && typeof window.turnstile.render === 'function') {
      renderWidget();
    } else {
      // Poll every 100ms until window.turnstile.render is available (max 60 attempts = 6s)
      let attempts = 0;
      pollTimer = setInterval(() => {
        attempts++;
        if (typeof window !== 'undefined' && window.turnstile && typeof window.turnstile.render === 'function') {
          if (pollTimer) clearInterval(pollTimer);
          renderWidget();
        } else if (attempts >= 60) {
          if (pollTimer) clearInterval(pollTimer);
        }
      }, 100);
    }

    return () => {
      isMounted = false;
      if (pollTimer) {
        clearInterval(pollTimer);
      }
      if (typeof window !== 'undefined' && window.turnstile && widgetIdRef.current !== null) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {}
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, theme, action]);

  return (
    <div className="turnstile-wrapper">
      <div ref={containerRef} className="cf-turnstile-container" />
    </div>
  );
});

TurnstileWidget.displayName = 'TurnstileWidget';

export default TurnstileWidget;

