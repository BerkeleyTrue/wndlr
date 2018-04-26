// @flow
import React from 'react';
// import PropTypes from 'prop-types';
import classnames from 'classnames/bind';

import styles from './home.sss';
import Section from '../UI/Section';

const cx = classnames.bind(styles);

export default function Home() {
  return (
    <Section className={ cx('home') }>
      <article className={ cx('article') }>
        <header>
          <h1>WNDLR</h1>
        </header>
        <p>
          WNDLR is a fitness app. It's designed for busy people who want to
          lift.
        </p>
      </article>
      <article className={ cx('article') }>
        <header>
          <h1>Simple</h1>
        </header>
        <p>
          It a simple system. No complex system to memorize, just one core
          workout a day. Four times a week.
        </p>
      </article>
      <arcticle className={ cx('article') }>
        <header>
          <h1>Fast</h1>
        </header>
        <p>
          You only need 20 minutes at the gym to get your lift in. No excuses,
          just get in, get it done, and get out.
        </p>
      </arcticle>
    </Section>
  );
}

Home.displayName = 'Home';
