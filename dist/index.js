
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./apollo-link-mock.cjs.production.min.js')
} else {
  module.exports = require('./apollo-link-mock.cjs.development.js')
}
