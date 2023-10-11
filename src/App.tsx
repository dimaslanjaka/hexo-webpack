import React from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import * as project from './project';
import routeMap from './routeMap';
import '@assets/css/main.scss';

const postRoute = project.routeConfig.map(routeMap).flat();

const router = createBrowserRouter([
  {
    path: '/',
    lazy: () => import('./components/FlowbiteLayout/index'),
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
    ].concat(postRoute)
  }
]);

class App extends React.Component {
  render() {
    return <RouterProvider router={router} fallbackElement={<div>Loading...</div>} />;
  }
}

export default App;
