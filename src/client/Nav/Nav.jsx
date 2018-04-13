import React from 'react';
import classnames from 'classnames/bind';
import styles from './nav-bar.sss';

const propTypes = {};
const cx = classnames.bind(styles);

export default function NavBar() {
  return (
    <nav className={ cx('nav-bar') }>
      <div className={ cx('logo') }>WNDLR</div>
      <button className={ cx('nav-auth-button') }>Sign In</button>
    </nav>
  );
}
NavBar.displayName = 'NavBar';
NavBar.propTypes = propTypes;
