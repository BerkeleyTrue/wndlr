// @flow
import React, { type Node } from 'react';
import classnames from 'classnames/bind';

import styles from './section.sss';

const cx = classnames.bind(styles);

type Props = {
  children: Node,
  className: string | void,
};
export default function Section({ children, className }: Props) {
  return <section className={ cx('section', className) }>{ children }</section>;
}

Section.displayName = 'Section';
