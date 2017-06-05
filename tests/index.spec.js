const { expect } = require('chai');
const serviceDeps = require('../src/');
const { CHECK_TIMEOUT } = require('../src/const');
const sinon = require('sinon');

/**
 * Log object mock
 */
const logger = () => ({
  info: () => { }
});

/**
 * Request object mocks
 * @param {Boolean} status true for success, false for error
 * @param {Number} code status code to return back
 * @param {Array} err List of URL where request should fail
 * @param {Boolean} once If true, will fail just once
 */
const request = (status, code = null, err = [], once = false) => (data, cb) => {
  if (status === false) {
    // Send error backs
    cb(true, null);
    return;
  }

  const url = data.url.replace(/\/status$/i, '');

  if (status === true && err.indexOf(url) !== -1) {
    if (once === true) {
      delete err[err.indexOf(url)];
    }
    cb(true, null);
    return;
  }

  // Send success back
  cb(null, {
    statusCode: code
  });
};

describe('serviceDeps', () => {
  it('should return promise', () => {
    const log = logger();
    const res = serviceDeps([], log, CHECK_TIMEOUT, request(true, 200));
    expect(res).to.be.instanceof(Promise);
  });
  it('should resolve if services are up and running', done => {
    serviceDeps(['a', 'b'], null, CHECK_TIMEOUT, request(true, 200))
      .then(() => done());
  });
  it('should log success message if all services are fine', done => {
    const log = logger();
    sinon.spy(log, 'info');
    serviceDeps(['a', 'b'], log, CHECK_TIMEOUT, request(true, 200))
      .then(() => {
        expect(log.info.calledOnce).to.be.true;
        done();
      });
  });
  it('should log twice error and success message if one service was not ready yet', done => {
    const log = logger();
    sinon.spy(log, 'info');
    serviceDeps(
      ['a', 'b'],
      log,
      1,
      request(true, 200, ['a'], true)
    ).then(() => {
      expect(log.info.calledTwice).to.be.true;
      done();
    });
  });
  it('should log and wait for all services af all are not ready yet', done => {
    const log = logger();
    sinon.spy(log, 'info');
    serviceDeps(
      ['a', 'b', 'c', 'd'],
      log,
      1,
      request(true, 200, ['a', 'b', 'c', 'd'], true)
    ).then(() => {
      expect(log.info.calledTwice).to.be.true;
      done();
    });
  });
});
