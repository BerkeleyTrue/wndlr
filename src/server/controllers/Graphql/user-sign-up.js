// @flow
/* eslint-disable max-len, indent */
import dedent from 'dedent';

export default ({
  email,
  token,
  url,
}: {
  email: string,
  token: string,
  url: string,
}) => dedent`
Welcome to the WNDRL community!

We have created a new account for you.

Here's your sign in link. It will instantly sign you into WNDLR.com - no password necessary:

${url}/passwordless-auth/?email=${email}&token=${token}

  Note: this sign in link will expire after 15 minutes. If you need a new sign in link, go to ${url}/signin

See you soon!

- The WNDLR Team`;
