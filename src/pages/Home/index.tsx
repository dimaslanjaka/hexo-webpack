/// <reference path='../../types/image-jpg.d.ts' />

import Image from '@components/Image';
import { routeConfig } from '@project';
import moment from 'moment-timezone';
import React from 'react';
import logo from './logo.jpg';

class Home extends React.Component {
  render() {
    return (
      <>
        <div className="mb-2">
          <img src={logo} alt="" style={{ width: '40px' }} />
        </div>
        <div className="flex flex-wrap -mx-1 lg:-mx-4">
          {routeConfig.map(o => (
            <div className="my-1 px-1 w-full md:w-1/2 lg:my-4 lg:px-4 lg:w-1/3" key={o.title + o.permalink}>
              <div className="max-w-sm">
                <article className="overflow-hidden rounded-lg shadow-lg" style={{ height: 450 }}>
                  <a href={o.permalink}>
                    <Image
                      alt="Placeholder"
                      className="block h-auto w-full"
                      fallbackSrc="https://picsum.photos/600/400/?random"
                      src={o.meta.og_image.content || 'https://picsum.photos/600/400/?random'}
                      style={{ height: 200 }}
                    />
                  </a>

                  <div className="p-2 md:p-4">
                    <header className="flex items-center justify-between leading-tight">
                      <h5 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white mb-2">
                        <a href={o.permalink} className="no-underline hover:underline text-black">
                          {o.title || o.permalink}
                        </a>
                      </h5>
                      <p className="text-grey-darker text-sm">
                        {moment(o.meta.date.content).format('YYYY/MM/HH') || '-'}
                      </p>
                    </header>

                    <p className="font-normal text-gray-700 dark:text-gray-400">{o.description}</p>
                  </div>
                </article>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }
}

export default Home;
