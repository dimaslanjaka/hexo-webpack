import React from 'react';
import { Outlet } from 'react-router-dom';

class Layout extends React.Component {
  render() {
    return (
      <>
        <Outlet />
      </>
    );
  }
}

export default Layout;
