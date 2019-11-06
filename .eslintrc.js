module.exports = {
  extends: 'google',
  parserOptions: {
    ecmaVersion: 2018,
    ecmaFeatures: {
      experimentalObjectRestSpread: true,
    },
  },
  rules: {
    "max-len": [
      2,
      {
        "code": 120,
        "tabWidth": 2,
        "ignoreUrls": true,
        "ignoreStrings": true,
      }
    ]
  },
};
