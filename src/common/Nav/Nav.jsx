import React from 'react';
import classnames from 'classnames/bind';
import Link from 'redux-first-router-link';

import styles from './nav-bar.sss';
import { onRouteSignIn } from '../Auth/redux';

const propTypes = {};
const cx = classnames.bind(styles);

export default function NavBar() {
  return (
    <nav className={ cx('nav-bar') }>
      <div className={ cx('logo') }>WNDLR</div>
      <Link
        className={ cx('nav-auth-button') }
        to={ onRouteSignIn() }
        >
        Sign In
      </Link>
    </nav>
  );
}
NavBar.displayName = 'NavBar';
NavBar.propTypes = propTypes;
