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
      if (typeof window !== 'undefined' && window.turnstile && widgetIdRef.current !== null) {
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
    let pollTimer = null;

    const renderWidget = () => {
      if (!isMounted || !containerRef.current || typeof window === 'undefined' || !window.turnstile) {
        return;
      }

      // If already rendered into this container, remove previous instance first
      if (widgetIdRef.current !== null) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {
          // ignore
        }
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

    const tryInit = () => {
      if (typeof window !== 'undefined' && window.turnstile) {
        if (typeof window.turnstile.ready === 'function') {
          window.turnstile.ready(renderWidget);
        } else {
          renderWidget();
        }
        return true;
      }
      return false;
    };

    // If turnstile is already ready, render immediately
    if (!tryInit()) {
      // Ensure script tag exists
      let script = document.querySelector('script[src*="turnstile/v0/api.js"]');
      if (!script) {
        script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        document.head.appendChild(script);
      }

      // Poll every 100ms until window.turnstile is available (max 50 attempts = 5s)
      let attempts = 0;
      pollTimer = setInterval(() => {
        attempts++;
        if (tryInit() || attempts >= 50) {
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
        } catch (e) {
          // ignore
        }
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
