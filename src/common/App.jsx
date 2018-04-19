import _ from 'lodash';
import React from 'react';
import { hot } from 'react-hot-loader';
import { connect } from 'react-redux';
import classnames from 'classnames/bind';

import './typography.global.sss';
import './index.global.sss';
import styles from './app.sss';

import Nav from './Nav';
import NotFound from './NotFound';
import { nsToComponent } from './routes';
import { mainRouterSelector } from './routes/redux';

const cx = classnames.bind(styles);
const propTypes = {};
const mapStateToProps = state => ({
  route: mainRouterSelector(state),
});

export function App({ route }) {
  const Comp = nsToComponent[route] || NotFound;
  return (
    <div className={ cx('main') }>
      <Nav />
      <div className={ cx('main-content') }>
        <h1>Hello WNDLR</h1>
        <Comp />
      </div>
    </div>
  );
}

export default _.flowRight(hot(module), connect(mapStateToProps))(App);

App.displayName = 'App';
App.propTypes = propTypes;
