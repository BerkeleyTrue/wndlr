// @flow
import React from 'react';
import classnames from 'classnames/bind';
import { Control, Errors } from 'react-redux-form';

import styles from './input.sss';

const cx = classnames.bind(styles);

type Props = {
  messages?: any,
  type: string,
  model: string,
  label: string,
};

type ControlProps = {
  model: string,
  type?: string,
};

export default function Input({
  messages,
  model,
  label,
  type,
  ...rest
}: Props) {
  const controlProps: ControlProps = { model, ...rest };
  let Comp = Control[type];
  if (!Comp) {
    controlProps.type = type;
    Comp = Control;
  }
  return (
    <div className={ cx('group') }>
      <label htmlFor={ model }>
        <Comp
          mapProps={ {
            className: ({
              fieldValue: { initialValue, value, touched, pristine, valid },
            }) =>
              cx({
                'has-value': initialValue !== value,
                input: true,
                pristine,
                touched,
                valid,
              }),
          } }
          { ...controlProps }
        />
        <span className={ cx('label') }>{ label }</span>
        <span className={ cx('bar') } />
        <span className={ cx('highlight') } />
      </label>
      { messages && (
        <Errors
          component={ ({ children }) =>
            <div className={ cx('error') }>{ children }</div>
          }
          messages={ messages }
          model={ model }
          show={ { touched: true, focus: false } }
        />
      ) }
    </div>
  );
}
Input.displayName = 'Input';
