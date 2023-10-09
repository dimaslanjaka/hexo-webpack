import React from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import project from '../_config.json';
import { routeConfig } from './project';

const postRoute = routeConfig
  .map(route => {
    const importPath = '../' + route.jsxPath.replace(project.base_dir, '').replace(/.jsx$/, '').replace(/^\//, '');
    // console.log(importPath);

    return [
      {
        path: route.permalink,
        async lazy() {
          const { default: Component } = await import(
            /* webpackChunkName: "[request]" */
            `${importPath}`
          );
          return { Component };
        }
      },
      {
        path: route.permalink.replace(/.html$/, ''),
        async lazy() {
          const { default: Component } = await import(
            /* webpackChunkName: "[request]" */
            `${importPath}`
          );
          return { Component };
        }
      }
    ];
  })
  .flat();

const router = createBrowserRouter([
  {
    path: '/',
    async lazy() {
      const { default: Layout } = await import('@components/Layout');
      return { Component: Layout };
    },
    children: [
      {
        index: true,
        async lazy() {
          const { default: Component } = await import('./pages/Home');
          return { Component };
        }
      },
      {
        path: '*',
        // element: <NoMatch />
        async lazy() {
          const { default: Component } = await import('@components/NoMatch');
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
