import React from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import * as project from './project';
import routeMap from './routeMap';
import {
  FlowbiteLoadStylesheet,
  FlowbiteSingleContentLayout,
  FlowbiteWithSidebarLayout
} from './components/FlowbiteLayout/utils';
import { initHljs } from './components/Highlight.js/helper';

FlowbiteLoadStylesheet();

const postRoute = project.routeConfig.map(routeMap).flat();

const router = createBrowserRouter([
  {
    lazy: FlowbiteWithSidebarLayout,
    children: [
      {
        index: true,
        async lazy() {
          const { default: Component } = await import('./pages/Home/index');
          return { Component };
        }
      },
      {
        path: '*',
        async lazy() {
          const { default: Component } = await import('./components/NoMatch');
          return { Component };
        }
      }
    ]
  },
  { lazy: FlowbiteSingleContentLayout, children: postRoute }
]);

window.adsense_option = Object.assign(window.adsense_option || {}, {
  root: '#FlowbiteLayout #flowbite-main-content',
  places: ['pre code.hljs'],
  localhost: ['adsense.webmanajemen.com', 'agc.io', 'dev.webmanajemen.com']
});

class App extends React.Component {
  componentDidMount(): void {
    initHljs();
    import('@components/Adsense/utils/exports').then(load => {
      load.setAdsenseConfig(window.adsense_option);
      load.triggerAdsense({ react: true });
    });
  }
  render() {
    return <RouterProvider router={router} fallbackElement={<div>Loading...</div>} />;
  }
}

export default App;
