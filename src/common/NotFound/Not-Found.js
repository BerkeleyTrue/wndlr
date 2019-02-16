import React from 'react';
// import PropTypes from 'prop-types';
import classnames from 'classnames/bind';

import styles from './not-found.sss';

const cx = classnames.bind(styles);

export default function NotFound() {
  return <div className={ cx('not-found') }>404 - Not Found</div>;
}

NotFound.displayName = 'NotFound';
