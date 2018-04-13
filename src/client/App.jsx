import React from 'react';
import { hot } from 'react-hot-loader';
import classnames from 'classnames/bind';
import styles from './app.sss';
import Nav from './Nav';

const propTypes = {};
const cx = classnames.bind(styles);

export function App() {
  return (
    <div className={ cx('main') }>
      <Nav />
      <div className={ cx('main-content') }>
        <h1>Hello WNDLR</h1>
      </div>
    </div>
  );
}

export default hot(module)(App);

App.displayName = 'App';
App.propTypes = propTypes;
