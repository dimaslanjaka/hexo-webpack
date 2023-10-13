/// <reference path='../../types/image-jpg.d.ts' />

import Image from '@components/Image';
import { projectConfig, routeConfig } from '@project';
import moment from 'moment-timezone';
import React from 'react';
import { BiSearch } from 'react-icons/bi';
import { Label, TextInput } from 'flowbite-react';

interface State {
  keyword: string;
}

class Home extends React.Component<any, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      keyword: ''
    };
  }

  render() {
    return (
      <React.Fragment>
        <div className="max-w">
          <div className="mb-2 block">
            <Label htmlFor="searchTerm" value="Search Post" />
          </div>
          <TextInput
            icon={BiSearch}
            id="searchTerm"
            placeholder="keywords"
            required
            type="text"
            onChange={e => {
              this.setState({ keyword: e.target.value });
            }}
          />
        </div>

        <div className="flex flex-wrap -mx-1 lg:-mx-4">
          {routeConfig
            .filter(o => {
              const kw = this.state.keyword;
              if (kw.length > 0) {
                return new RegExp(kw, 'gmi').test(o.title + ' ' + o.description);
              }
              return true;
            })
            .map(o => (
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

                      <footer className="flex items-center justify-between leading-none p-2 md:p-4">
                        <a className="flex items-center no-underline hover:underline text-black" href="#">
                          <Image
                            alt="author"
                            className="block rounded-full"
                            src="https://png.pngtree.com/png-vector/20191125/ourmid/pngtree-beautiful-admin-roles-line-vector-icon-png-image_2035379.jpg"
                            height={32}
                            width={32}
                          />
                          <p className="ml-2 text-sm">
                            {(o.meta.author && o.meta.author.content) || projectConfig.author || 'L3n4r0x'}
                          </p>
                        </a>
                        {/* <a className="no-underline text-grey-darker hover:text-red-dark" href="#">
                          <span className="hidden">Like</span>
                          <i className="fa fa-heart"></i>
                        </a> */}
                      </footer>
                    </div>
                  </article>
                </div>
              </div>
            ))}
        </div>
      </React.Fragment>
    );
  }
}

export default Home;
