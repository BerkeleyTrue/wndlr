// @flow
import React, { type Element } from 'react';
import classnames from 'classnames/bind';

import styles from './section.sss';

const cx = classnames.bind(styles);

type Props = {
  children: Element<*>,
  className: string | void,
};
export default function Section({ children, className }: Props): Element<*> {
  return <section className={ cx('section', className) }>{ children }</section>;
}

Section.displayName = 'Section';
