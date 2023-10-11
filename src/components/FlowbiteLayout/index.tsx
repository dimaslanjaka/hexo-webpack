import React from 'react';
import { Outlet } from 'react-router-dom';

function FlowbiteLayout() {
  return (
    <>
      <Outlet />
    </>
  );
}

export default FlowbiteLayout;
export { FlowbiteLayout as Component };
