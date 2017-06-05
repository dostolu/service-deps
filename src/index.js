const request = require('request');
const { CHECK_TIMEOUT } = require('./const');

/**
 * Wait for all services to be up and running where we have deps
 * @param {Array} services Services list
 * @param {Object} log Log objectss
 * @param {Number} to millisecinds delay between tries
 * @param {Function} req UT
 */
const serviceDeps = (services = [], log = null, to = CHECK_TIMEOUT, req = request) =>
  new Promise((resolve) => {
    const check = () => {
      const promisePool = [];
      services.forEach(service => promisePool.push(
        new Promise((res, rej) => {
          req({
            url: `${service}/status`,
            json: true,
            headers: {
              accepts: 'application/json'
            }
          }, (error, response) => {
            if (error || response.statusCode !== 200) {
              rej();
            } else {
              res();
            }
          });
        })
      ));
      Promise.all(promisePool)
        .then(() => {
          log && log.info('Services are ready, starting process');
          resolve();
        })
        .catch(() => {
          log && log.info(
            `One of the services is not ready yet, waiting ${to / 1000} seconds more`
          );
          setTimeout(check, to);
        });
    };
    check();
  });

module.exports = serviceDeps;
