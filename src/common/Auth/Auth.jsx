// @flow
import React from 'react';
import classnames from 'classnames/bind';
import { Form } from 'react-redux-form';

import styles from './auth.sss';
import { ns } from './redux';
import { Input } from '../Form';

const cx = classnames.bind(styles);

export default function Auth() {
  return (
    <div className={ cx('auth') }>
      <header className={ cx('header') }>
        <h1>Enter Your Email</h1>
        <p>
          This will log you in or sign you up if you don't already have an
          account.
        </p>
      </header>
      <Form
        className={ cx('form') }
        model={ `${ns}.user` }
        >
        <Input
          label='Email'
          model='.email'
          name='email'
          type='email'
        />
      </Form>
      <button
        className={ cx('submit') }
        type='submit'
        >
        Get a sign in link
      </button>
    </div>
  );
}

Auth.displayName = 'Auth';
