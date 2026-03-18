'use client';

import { useEffect } from 'react';
import { SystemCanvas } from '@/components';

/**
 * Main application page.
 * Renders the full System canvas application (enabledby.cloud/system).
 */
export default function Home() {
  // Hide loading screen once app is mounted
  useEffect(() => {
    const loadingEl = document.getElementById('app-loading');
    if (loadingEl) {
      // Small delay to ensure smooth transition
      requestAnimationFrame(() => {
        loadingEl.classList.add('loaded');
      });
    }
  }, []);

  return <SystemCanvas />;
}
