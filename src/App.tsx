import React from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
// import routeConfig from '../routes.json';
// import Markdown from 'react-markdown';
// import rehypeRaw from 'rehype-raw';
// import remarkGfm from 'remark-gfm';

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
        // element: <Markdown remarkPlugins={[[remarkGfm]]} rehypePlugins={[rehypeRaw]} children={Sample} />
        async lazy() {
          const { default: Component } = await import('../test/tmp/body');
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
    ]
  }
]);

class App extends React.Component {
  render() {
    return <RouterProvider router={router} fallbackElement={<div>Loading...</div>} />;
  }
}

export default App;
