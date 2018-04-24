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
      <header>
        <h1>Welcome to WNDLR</h1>
      </header>
      <article>
        <p>
          WNDLR is a fitness app. It's designed for busy people who want to
          lift.
        </p>
      </article>
    </div>
  );
}
Home.displayName = 'Home';
Home.propTypes = propTypes;
