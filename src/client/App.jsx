import React from 'react';
// import PropTypes from 'prop-types';
import { hot } from 'react-hot-loader';

const propTypes = {};

export function App() {
  return (
    <div>
      <h1>Hello WNDLR</h1>
    </div>
  );
}

export default hot(module)(App);

App.displayName = 'App';
App.propTypes = propTypes;
