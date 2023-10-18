import React from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { initHljs } from './components/Highlight.js/helper';
import * as project from './project';
import routeMap from './routeMap';

const postRoute = project.routeConfig.map(routeMap).flat();

const router = createBrowserRouter([
  {
    lazy: async () => {
      const { default: Component } = await import(
        /* webpackChunkName: "flowbite-with-sidebar-layout" */ '@components/FlowbiteLayout/index'
      );
      return { Component };
    },
    children: [
      {
        index: true,
        async lazy() {
          const { default: Component } = await import('./layout/Home/index');
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
  {
    lazy: async () => {
      const { FlowbiteLayoutWithoutSidebar: Component } = await import(
        /* webpackChunkName: "flowbite-with-sidebar-layout" */ '@components/FlowbiteLayout/index'
      );
      return { Component };
    },
    children: postRoute
  }
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
