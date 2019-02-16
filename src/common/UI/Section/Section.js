import React from 'react';
import classnames from 'classnames/bind';

import styles from './section.sss';

const cx = classnames.bind(styles);

export default function Section({ children, className }) {
  return <section className={ cx('section', className) }>{ children }</section>;
}

Section.displayName = 'Section';
