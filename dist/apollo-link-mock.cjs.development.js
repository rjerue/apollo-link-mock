'use strict';

var apolloLink = require('apollo-link');
var printer = require('graphql/language/printer');
var apolloUtilities = require('apollo-utilities');

function _inheritsLoose(subClass, superClass) {
  subClass.prototype = Object.create(superClass.prototype);
  subClass.prototype.constructor = subClass;
  subClass.__proto__ = superClass;
}

var isEqual =
/*#__PURE__*/
require('lodash.isequal');

var MockLink =
/*#__PURE__*/
function (_ApolloLink) {
  _inheritsLoose(MockLink, _ApolloLink);

  function MockLink(mockedResponses, addTypename) {
    var _this;

    if (addTypename === void 0) {
      addTypename = true;
    }

    _this = _ApolloLink.call(this) || this;
    _this.addTypename = true;
    _this.mockedResponsesByKey = {};
    _this.addTypename = addTypename;
    if (mockedResponses) mockedResponses.forEach(function (mockedResponse) {
      _this.addMockedResponse(mockedResponse);
    });
    return _this;
  }

  var _proto = MockLink.prototype;

  _proto.addMockedResponse = function addMockedResponse(mockedResponse) {
    var key = requestToKey(mockedResponse.request, this.addTypename);
    var mockedResponses = this.mockedResponsesByKey[key];

    if (!mockedResponses) {
      mockedResponses = [];
      this.mockedResponsesByKey[key] = mockedResponses;
    }

    mockedResponses.push(mockedResponse);
  };

  _proto.request = function request(operation) {
    var key = requestToKey(operation, this.addTypename);
    var responseIndex;
    var response = (this.mockedResponsesByKey[key] || []).find(function (res, index) {
      var requestVariables = operation.variables || {};
      var mockedResponseVariables = res.request.variables || {};

      if (!isEqual(requestVariables, mockedResponseVariables)) {
        return false;
      }

      responseIndex = index;
      return true;
    });

    if (!response || typeof responseIndex === 'undefined') {
      throw new Error("No more mocked responses for the query: " + printer.print(operation.query) + ", variables: " + JSON.stringify(operation.variables));
    }

    if (!response.keep) {
      this.mockedResponsesByKey[key].splice(responseIndex, 1);
    }

    var result = response.result,
        error = response.error,
        delay = response.delay,
        newData = response.newData;

    if (newData) {
      response.result = newData();
      this.mockedResponsesByKey[key].push(response);
    }

    if (!result && !error) {
      throw new Error("Mocked response should contain either result or error: " + key);
    }

    return new apolloLink.Observable(function (observer) {
      var timer = setTimeout(function () {
        if (error) {
          observer.error(error);
        } else {
          if (result) observer.next(result);
          observer.complete();
        }
      }, delay ? delay : 0);
      return function () {
        clearTimeout(timer);
      };
    });
  };

  return MockLink;
}(apolloLink.ApolloLink);
var MockSubscriptionLink =
/*#__PURE__*/
function (_ApolloLink2) {
  _inheritsLoose(MockSubscriptionLink, _ApolloLink2);

  function MockSubscriptionLink() {
    var _this2;

    _this2 = _ApolloLink2.call(this) || this; // private observer: Observer<any>;

    _this2.unsubscribers = [];
    _this2.setups = [];
    return _this2;
  }

  var _proto2 = MockSubscriptionLink.prototype;

  _proto2.request = function request(_req) {
    var _this3 = this;

    return new apolloLink.Observable(function (observer) {
      _this3.setups.forEach(function (x) {
        return x();
      });

      _this3.observer = observer;
      return function () {
        _this3.unsubscribers.forEach(function (x) {
          return x();
        });
      };
    });
  };

  _proto2.simulateResult = function simulateResult(result) {
    var _this4 = this;

    setTimeout(function () {
      var observer = _this4.observer;
      if (!observer) throw new Error('subscription torn down');
      if (result.result && observer.next) observer.next(result.result);
      if (result.error && observer.error) observer.error(result.error);
    }, result.delay || 0);
  };

  _proto2.onSetup = function onSetup(listener) {
    this.setups = this.setups.concat([listener]);
  };

  _proto2.onUnsubscribe = function onUnsubscribe(listener) {
    this.unsubscribers = this.unsubscribers.concat([listener]);
  };

  return MockSubscriptionLink;
}(apolloLink.ApolloLink);

function requestToKey(request, addTypename) {
  var queryString = request.query && printer.print(addTypename ? apolloUtilities.addTypenameToDocument(request.query) : request.query);
  var requestKey = {
    query: queryString
  };
  return JSON.stringify(requestKey);
} // Pass in multiple mocked responses, so that you can test flows that end up
// making multiple queries to the server
// NOTE: The last arg can optionally be an `addTypename` arg


function mockSingleLink() {
  for (var _len = arguments.length, mockedResponses = new Array(_len), _key = 0; _key < _len; _key++) {
    mockedResponses[_key] = arguments[_key];
  }

  // to pull off the potential typename. If this isn't a boolean, we'll just set it true later
  var maybeTypename = mockedResponses[mockedResponses.length - 1];
  var mocks = mockedResponses.slice(0, mockedResponses.length - 1);

  if (typeof maybeTypename !== 'boolean') {
    mocks = mockedResponses;
    maybeTypename = true;
  }

  return new MockLink(mocks, maybeTypename);
}
function mockObservableLink() {
  return new MockSubscriptionLink();
}

exports.MockLink = MockLink;
exports.MockSubscriptionLink = MockSubscriptionLink;
exports.mockObservableLink = mockObservableLink;
exports.mockSingleLink = mockSingleLink;
//# sourceMappingURL=apollo-link-mock.cjs.development.js.map
