import _ from 'lodash';
import React from 'react';
import { hot } from 'react-hot-loader';
import { connect } from 'react-redux';
import classnames from 'classnames/bind';

import './typography.global.sss';
import './index.global.sss';
import styles from './app.sss';

import Nav from './Nav';
import Auth from './Auth';
import { mainRouterSelector } from './routes/redux';

const cx = classnames.bind(styles);
const propTypes = {};
const mapStateToProps = state => ({
  route: mainRouterSelector(state),
});

export function App() {
  return (
    <div className={ cx('main') }>
      <Nav />
      <div className={ cx('main-content') }>
        <h1>Hello WNDLR</h1>
        <Auth />
      </div>
    </div>
  );
}

export default _.flow(hot(module), connect(mapStateToProps))(App);

App.displayName = 'App';
App.propTypes = propTypes;
