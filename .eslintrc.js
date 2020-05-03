module.exports = {
  extends: 'google',
  parserOptions: {
    ecmaVersion: 11,
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
