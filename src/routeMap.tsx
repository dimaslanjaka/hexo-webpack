import { Route, projectConfig } from '@root/src/project';
import React from 'react';
import { useLoaderData } from 'react-router-dom';
import { DisqusEmbed } from './components/Disqus/DisqusEmbed';
import FlowbiteCarousel from './components/FlowbiteLayout/Carousel';
import { BiSolidCategoryAlt } from 'react-icons/bi';
import { PiTagSimpleFill } from 'react-icons/pi';

export default function routeMap(route: Route) {
  const importPath = './' + route.jsxPath.replace(projectConfig.paths.src, '').replace(/^\//, '');
  //.replace(/.jsx$/, '');
  // console.log(importPath);
  const { body: _body, ...data } = route;

  const loader = ({ request }) => {
    return { url: request.url, ...data };
  };

  const lazy = async () => {
    const { default: Post } = (await import(
      /* webpackChunkName: "post-[request]" */
      /* webpackPrefetch: true */
      `${importPath}`
    )) as { default: () => JSX.Element };
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
          <div className="post">
            <div className="w-full sm:w-fit">
              <h1 className="mb-4 text-3xl">{data.title}</h1>
              <p className="mb-6 flex items-center uppercase">
                <BiSolidCategoryAlt className="mr-1" />
                {meta.categories && meta.categories.join(', ')}
              </p>
            </div>

            <Post />

            <div className="flex mt-4">
              <PiTagSimpleFill className="mr-1" />
              {meta.tags &&
                meta.tags.map(tag => (
                  <div
                    key={'tag-' + tag}
                    className="bg-blue-100 text-blue-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-300"
                  >
                    {tag}
                  </div>
                ))}
            </div>

            {/* mix photos */}
            {meta.photos && (
              <div className="py-4 h-56 sm:h-64 xl:h-80 2xl:h-96">
                <FlowbiteCarousel data={meta.photos} height="100%" />
              </div>
            )}

            <DisqusEmbed shortname="dimaslanjaka" config={disqus_config} />
          </div>
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
