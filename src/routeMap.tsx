import { Route, projectConfig } from '@root/src/project';
import React from 'react';
import { useLoaderData } from 'react-router-dom';
import { DisqusEmbed } from './components/Disqus/DisqusEmbed';
import FlowbiteCarousel from './components/FlowbiteLayout/Carousel';

export default function routeMap(route: Route) {
  const importPath = './' + route.jsxPath.replace(projectConfig.paths.src, '').replace(/^\//, '');
  //.replace(/.jsx$/, '');
  // console.log(importPath);
  const { body: _body, ...data } = route;

  const loader = ({ request }) => {
    return { url: request.url, ...data };
  };

  const lazy = async () => {
    const { default: Post } = await import(
      /* webpackChunkName: "[request]" */
      /* webpackPrefetch: true */
      `${importPath}`
    );
    return {
      Component: () => {
        const data = (useLoaderData() || { meta: {} }) as ReturnType<typeof loader>;
        const [meta, setMeta] = React.useState(data.meta as import('hexo-post-parser').postMeta & Record<string, any>);
        React.useEffect(() => {
          document.title = data.title;
          import('@root/tmp/meta/' + data.id + '.json').then(importedMeta => {
            setMeta({ ...data.meta, ...importedMeta });
          });

          return () => {
            //
          };
        });

        // const thumbnail = data.meta.og_image
        //   ? data.meta.og_image.content
        //   : 'https://mdbcdn.b-cdn.net/img/new/slides/194.jpg';
        const disqus_canonical = data.meta.canonical ? data.meta.canonical.href : location.href;
        const disqus_config = {
          url: disqus_canonical,
          identifier: new URL(disqus_canonical).pathname,
          title: data.title
          // language: (data.meta.language && data.meta.language.content) || 'en_US'
        };
        // console.log(disqus_config);
        return (
          <>
            <div>
              <h1 className="mb-4 text-3xl font-bold">{data.title}</h1>
              <p className="mb-6 flex items-center font-bold uppercase text-danger dark:text-danger-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  className="mr-2 h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z"
                  />
                </svg>
                {data.id}
              </p>
            </div>

            <Post />

            {/* mix photos */}
            {meta.photos && (
              <div className="py-4 h-56 sm:h-64 xl:h-80 2xl:h-96">
                <FlowbiteCarousel data={meta.photos} height="100%" />
              </div>
            )}

            <DisqusEmbed shortname="dimaslanjaka" config={disqus_config} />
          </>
        );
      }
    };
  };

  /** permalink with single slash */
  const perm = '/' + route.permalink.replace(/^\/{1,}/, '');

  return [
    {
      path: perm,
      loader,
      lazy
    },
    {
      path: perm.replace(/.html$/, ''),
      loader,
      lazy
    }
  ];
}
