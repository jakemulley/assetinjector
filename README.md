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
basePaths: [],
omit: '',
source: ''
```

## Usage

### Editing the Source File
Edit your source file to contain comments where you'd like to inject these files, and the semantic type should match the file extension you want to inject. For example:
```
To inject CSS:
<!--inject:css-->
<!--inject:stop-->

To inject JS:
<!--inject:js-->
<!--inject:stop-->
```
And then appropriate elements will be added between the comments.

Currently the module has support for JS and CSS files, but please [request another](https://github.com/jakemulley/assetinjector/issues) if you'd like more.

### NPM
```
var injector = require('assetinjector');
injector({source: './public/header.html', basePaths: ['./public/_css', './public/_js'], omit: './public'});
```

### Gulp
Coming soon.
