import React from 'react';
import TabBar from './TabBar';

interface Props {
  children: React.ReactNode;
}

const AppWrapper = ({ children }: Props) => (
  <div className="app-outer">
    <div className="app-wrapper">
      <div className="app-content">
        {children}
      </div>
      <TabBar />
    </div>
  </div>
);

export default AppWrapper;
