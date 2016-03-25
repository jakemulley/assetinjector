Asset Injector
==============
> Easy asset injection with NPM.

## Installation
```
npm i assetinjector --save-dev
```

## Options
- `attributes` (object) - Add attributes to `<link>` or `<script>` tags
- `basePaths` (array) - List of folders with files inside to inject into the source file
- `omit` (string) - A string to omit from the reference in the injection (useful if you output to a separate folder from assets)
- `source` (string) - The source file that you want to inject into

### Defaults
```
attributes: {
  'css': {
    rel: 'stylesheet',
    type: 'text/css'
  },
  'js': null
},
basePaths: ['./public/_css', './public/_js'],
omit: './public',
source: './public/index.html'
```

## Usage
### NPM
```
var injector = require('assetinjector');
injector({source: './public/header.html'});
```

### Gulp
Coming soon.
