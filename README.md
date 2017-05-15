# PurpleBot

[![Build Status](https://travis-ci.org/dpyro/purplebot.svg?branch=master)](https://travis-ci.org/dpyro/purplebot)
[![Known Vulnerabilities](https://snyk.io/test/github/dpyro/purplebot/badge.svg)](https://snyk.io/test/github/dpyro/purplebot)

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

An IRC bot using Node.js and modern JavaScript.

## Things to do

```shell
npm start -- --help
```

Testing uses Mocha with Chai with Nock HTTP mocking.

```shell
npm test
```

Make the documentation.

```shell
npm run doc
```

This project conforms to [JavaScript Standard Style](https://github.com/feross/standard).

```shell
npm run lint
```

## Config

### Settings

- server
- socket
- channels
- auth:nick
- auth:pass
- plugins:enabled

## Plugins

To create a plugin, implement the following interface in either TypeScript or JavaScript in `plugins` or `~/.purplebot/plugins`.

```typescript
/**
 * Plugin API.
 */
export interface Plugin {
  /**
   * Plugin name used for identification and configuration.
   */
  readonly name: string

  /**
   * Asynchronously load the resources for this plugin.
   */
  load? (bot: PurpleBot, config: Config): Promise<void>

  /**
   * Reset the plugin's data.
   */
  reset? (): Promise<void>
}
```

## References

* [RFC 2812](https://tools.ietf.org/html/rfc2812)
