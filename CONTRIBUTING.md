Code style for this application is based on Google's code style standards for
JavaScript, and is enforced by the use of ESLint and Travis. All contributors
should ensure that their code passes the tests that ESLint performs prior to
submission for a pull request. The Google style guide is viewable
[here](https://google.github.io/styleguide/jsguide.html)

Listed below is a non-exhaustive list of other rules and guidelines that will be
taken into account when merging code.

* Make use of Winston for logging at a sane level. Use of `console.log` is
  forbidden; use `require('winston'); winston.log('debug', 'Foo %s', bar);`
* Direct access to the database via the `pool` property on the database module
  is discouraged; create new methods on the database module if needed
* When writing or consuming asynchronous code from elsewhere, try to use the
  `async`/`await` syntax to reduce complexity
