/* global gtag */
import { projectConfig } from '@root/src/project';
import { insertBefore } from '@root/src/utils';
import { TAG_ID, fetchIp, gtagBuilder } from './userData';
import './dummy';

/**
 * call google analytics script
 */
export default function callGAnalytics() {
  const src = '//www.googletagmanager.com/gtag/js?id=' + TAG_ID;
  // console.log('call google analytics', !document.querySelector(`script[src="${src}"]`));
  if (!document.querySelector(`script[src="${src}"]`)) {
    const script = document.createElement('script');
    script.src = src;
    // script.async = true;
    script.onload = sendInitialData;
    const reference = document.getElementsByName('script')[0] || document.getElementsByName('meta')[0];
    if (reference) {
      insertBefore(script, reference);
    } else {
      document.body.appendChild(script);
    }
  }
}

function sendInitialData() {
  // console.log('google analytics sending initial data');
  gtag('js', new Date());
  // window.gtag('config', TAG_ID);
  // send user by ip
  fetchIp().then(() => {
    // send custom event
    gtag(
      'event',
      'screen_view',
      gtagBuilder({
        app_name: projectConfig.title,
        screen_name: document.title
      })
    );
  });
}
