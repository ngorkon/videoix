import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');
  const bypassMode = searchParams.get('bypass') || 'standard';
  const referer = searchParams.get('referer') || 'https://www.dailymotion.com';
  const userAgent = searchParams.get('ua') || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  if (!targetUrl) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  try {
    console.log(`🔗 Proxying request to: ${targetUrl} (${bypassMode.toUpperCase()} mode)`);
    
    // Base headers for all requests
    const baseHeaders: Record<string, string> = {
      'User-Agent': userAgent,
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'identity',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Referer': referer,
      'Origin': new URL(referer).origin,
      'Sec-Fetch-Dest': 'iframe',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'cross-site',
      'Upgrade-Insecure-Requests': '1',
      'X-Requested-With': 'XMLHttpRequest'
    };

    // Advanced bypass mode adds extra anti-detection headers
    if (bypassMode === 'advanced') {
      Object.assign(baseHeaders, {
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'X-Forwarded-For': '8.8.8.8',
        'X-Real-IP': '8.8.8.8',
        'CF-Connecting-IP': '8.8.8.8',
        'X-Forwarded-Proto': 'https'
      });
    }

    const response = await fetch(targetUrl, {
      headers: baseHeaders,
      redirect: 'follow',
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      console.warn(`⚠️ Proxy response not OK: ${response.status} ${response.statusText}`);
    }

    let content = await response.text();
    const contentType = response.headers.get('Content-Type') || 'text/html';
    
    // If it's HTML content, inject our bypass scripts based on mode
    if (contentType.includes('text/html')) {
      // Inject anti-detection scripts
      const bypassScript = bypassMode === 'advanced' ? `
        <script>
          // Advanced anti-detection measures
          (function() {
            console.log('[VideoiX Proxy] Advanced anti-detection mode activated');
            
            // Override iframe detection completely
            if (window.parent !== window) {
              Object.defineProperty(window, 'parent', { value: window, writable: false });
              Object.defineProperty(window, 'top', { value: window, writable: false });
              Object.defineProperty(window, 'frameElement', { value: null, writable: false });
              
              // Mock self reference
              Object.defineProperty(window, 'self', { value: window, writable: false });
            }
            
            // Override location and document properties
            try {
              const targetHostname = '${new URL(referer).hostname}';
              Object.defineProperty(window.location, 'hostname', { 
                value: targetHostname,
                writable: false 
              });
              Object.defineProperty(document, 'domain', { 
                value: targetHostname,
                writable: false 
              });
              Object.defineProperty(document, 'referrer', { 
                value: '${referer}',
                writable: false 
              });
            } catch(e) {}
            
            // Override navigator properties to avoid bot detection
            Object.defineProperty(navigator, 'webdriver', { value: undefined, writable: false });
            Object.defineProperty(navigator, 'plugins', { value: Array(5).fill({}), writable: false });
            Object.defineProperty(navigator, 'languages', { value: ['en-US', 'en'], writable: false });
            Object.defineProperty(navigator, 'platform', { value: 'Win32', writable: false });
            
            // Mock screen properties
            Object.defineProperty(screen, 'width', { value: 1920, writable: false });
            Object.defineProperty(screen, 'height', { value: 1080, writable: false });
            Object.defineProperty(screen, 'availWidth', { value: 1920, writable: false });
            Object.defineProperty(screen, 'availHeight', { value: 1040, writable: false });
            
            // Disable anti-iframe detection events
            const originalAddEventListener = window.addEventListener;
            window.addEventListener = function(type, listener, options) {
              if (type === 'message' || type === 'blur' || type === 'focus') {
                return; // Block these events that detect iframe usage
              }
              return originalAddEventListener.call(this, type, listener, options);
            };
            
            // Override postMessage to filter iframe detection
            const originalPostMessage = window.postMessage;
            window.postMessage = function(message, targetOrigin) {
              if (typeof message === 'string' && (message.includes('iframe') || message.includes('embed'))) {
                return; // Block iframe-related messages
              }
              return originalPostMessage.call(this, message, targetOrigin);
            };
            
            // Simulate user presence
            setInterval(() => {
              document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
            }, 30000);
            
            // Override console to prevent detection logging
            const noop = () => {};
            console.log = console.warn = console.error = console.info = noop;
          })();
        </script>
      ` : `
        <script>
          // Standard anti-detection measures
          (function() {
            console.log('[VideoiX Proxy] Standard anti-detection mode activated');
            
            // Basic iframe detection bypass
            if (window.parent !== window) {
              Object.defineProperty(window, 'parent', { value: window });
              Object.defineProperty(window, 'top', { value: window });
              Object.defineProperty(window, 'frameElement', { value: null });
            }
            
            // Override location to match expected domain
            try {
              Object.defineProperty(window.location, 'hostname', { 
                value: '${new URL(referer).hostname}',
                writable: false 
              });
              Object.defineProperty(document, 'domain', { 
                value: '${new URL(referer).hostname}',
                writable: false 
              });
            } catch(e) {}
            
            // Basic navigator override
            Object.defineProperty(navigator, 'webdriver', { value: undefined });
            
            // Disable common anti-iframe detection
            window.addEventListener('message', function(e) {
              e.stopImmediatePropagation();
            }, true);
            
            // Simulate user interaction
            setTimeout(() => {
              const event = new MouseEvent('click', { bubbles: true });
              document.dispatchEvent(event);
            }, 1000);
          })();
        </script>
      `;
      
      // Inject the script before the closing head tag or at the beginning of body
      if (content.includes('</head>')) {
        content = content.replace('</head>', `${bypassScript}</head>`);
      } else if (content.includes('<body')) {
        content = content.replace('<body', `${bypassScript}<body`);
      } else {
        content = bypassScript + content;
      }
    }
    
    // Set comprehensive CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, HEAD',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Credentials': 'true',
      'Content-Type': contentType,
      'X-Proxy-Source': 'videoix-enhanced-proxy',
      'X-Frame-Options': 'ALLOWALL', // Override frame restrictions
      'Content-Security-Policy': 'frame-ancestors *' // Allow framing from any origin
    };

    // Remove headers that might cause issues
    const responseHeaders = new Headers(corsHeaders);
    
    console.log(`✅ Proxy successful for: ${targetUrl}`);
    
    return new NextResponse(content, {
      status: response.status,
      headers: responseHeaders
    });

  } catch (error) {
    console.error('❌ Proxy error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch content',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': '*'
        }
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': '*'
    }
  });
}
