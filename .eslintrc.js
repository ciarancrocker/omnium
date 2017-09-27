module.exports = {
  extends: 'google',
  parserOptions: {
    ecmaVersion: 2017,
  },
  rules: {
    "max-len": [    
      2,
      {                       
        "code": 120,  
        "tabWidth": 2,
        "ignoreUrls": true,
        "ignorePattern": "^goog.(module|require)"
      }                    
    ]
  },
};
