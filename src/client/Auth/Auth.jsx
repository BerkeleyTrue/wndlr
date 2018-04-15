import React from 'react';
// import PropTypes from 'prop-types';
import classnames from 'classnames/bind';

import styles from './auth.sss';

const cx = classnames.bind(styles);
const propTypes = {};

export default function Auth() {
  return (
    <div className={ cx('auth') }>
      <form>
        <input name='email' />
      </form>
    </div>
  );
}
Auth.displayName = 'Auth';
Auth.propTypes = propTypes;
