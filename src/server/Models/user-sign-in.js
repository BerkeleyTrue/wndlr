/* eslint-disable max-len, indent */
import dedent from 'dedent';

export default ({
  guid,
  token,
  url,
}) => dedent`
Here's your sign in link. It will instantly sign you into WNDLR.com - no password necessary:

${url}/passwordless-auth?guid=${guid}&token=${token}

    Note: this sign in link will expire after 15 minutes. If you need a new sign in link, go to ${url}/sign-in

See you soon!

- The WNDLR Team`;
