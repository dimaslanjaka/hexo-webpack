/// <reference path='../../types/image-jpg.d.ts' />

import React from 'react';
import logo from './logo.jpg';
import { routeConfig } from '@project';

class Home extends React.Component {
  render() {
    return (
      <>
        <div className="mb-2">
          <img src={logo} alt="" style={{ width: '40px' }} />
        </div>
        <u className="mb-6 list-inside list-disc">
          {routeConfig.map(o => (
            <li key={o.title}>
              <a href={o.permalink}>{o.permalink || o.title}</a>
            </li>
          ))}
        </u>
      </>
    );
  }
}

export default Home;
