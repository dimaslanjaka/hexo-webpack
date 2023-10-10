import '@assets/css/main.scss';
import React from 'react';
import { Outlet } from 'react-router-dom';
import './style.scss';
import { projectConfig } from '@root/src/project';

export function Component() {
  return (
    <>
      <nav className="fixed top-0 flex w-full flex-wrap items-center justify-between bg-[#FBFBFB] py-2 text-neutral-500 shadow-lg hover:text-neutral-700 focus:text-neutral-700 dark:bg-neutral-600 lg:py-4">
        <div className="flex w-full flex-wrap items-center justify-between px-3">
          <div>
            <a
              className="mx-2 my-1 flex items-center text-neutral-900 hover:text-neutral-900 focus:text-neutral-900 lg:mb-0 lg:mt-0"
              href="#"
            >
              <img
                className="mr-2"
                src="https://tecdn.b-cdn.net/img/logo/te-transparent-noshadows.webp"
                style={{ height: '20px' }}
                alt="TE Logo"
                loading="lazy"
              />
              <span className="font-medium dark:text-neutral-200">{projectConfig.title}</span>
            </a>
          </div>
        </div>
      </nav>
      <div className="container my-24 mx-auto md:px-6">
        <Outlet />
      </div>
    </>
  );
}
