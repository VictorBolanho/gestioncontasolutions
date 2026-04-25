const pick = (object, keys) => {
  return keys.reduce((accumulator, key) => {
    if (Object.prototype.hasOwnProperty.call(object, key) && object[key] !== undefined) {
      accumulator[key] = object[key];
    }
    return accumulator;
  }, {});
};

module.exports = { pick };
