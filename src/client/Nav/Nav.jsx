import React from 'react';
import classnames from 'classnames/bind';
import styles from './nav-bar.sss';

const propTypes = {};
const cx = classnames.bind(styles);

export default function NavBar() {
  return <nav className={ cx('nav-bar') }>bar</nav>;
}
NavBar.displayName = 'NavBar';
NavBar.propTypes = propTypes;
