import React from 'react';
import classnames from 'classnames/bind';
import Link from 'redux-first-router-link';

import styles from './nav-bar.sss';
import { onRouteHome } from '../Home/redux';
import { onRouteSignIn } from '../Auth/redux';

const cx = classnames.bind(styles);

export default function NavBar() {
  return (
    <nav className={ cx('nav-bar') }>
      <Link
        className={ cx('logo') }
        to={ onRouteHome() }
        >
        WNDLR
      </Link>
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
