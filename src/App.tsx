import React from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import * as project from './project';
import routeMap from './routeMap';
import '@assets/css/main.scss';
import {
  FlowbiteLoadStylesheet,
  FlowbiteSingleContentLayout,
  FlowbiteWithSidebarLayout
} from './components/FlowbiteLayout/utils';

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

class App extends React.Component {
  render() {
    return <RouterProvider router={router} fallbackElement={<div>Loading...</div>} />;
  }
}

export default App;
