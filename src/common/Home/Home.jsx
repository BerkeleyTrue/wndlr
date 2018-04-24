// @flow
import React from 'react';
// import PropTypes from 'prop-types';
import classnames from 'classnames/bind';

import styles from './home.sss';

const cx = classnames.bind(styles);
const propTypes = {};

export default function Home() {
  return (
    <div className={ cx('home') }>
      Home
    </div>
  );
}
Home.displayName = 'Home';
Home.propTypes = propTypes;
