'use strict';

// Required modules
var colors      = require('colors'),
    deepAssign  = require('deep-assign'),
    fs          = require('fs'),
    performance = require('performance-now'),
    q           = require('q');

// Regular Expressions
var matchBlock = /(<!--inject:([a-z]*)-->)(?:[^])*?(<!--inject:stop-->)/gm;

// Default Options
var defaultOptions = {
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
};

var options,
    fileList = [],
    sorted   = [],
    start;

module.exports = function(opts) {

  start = performance();

  options = deepAssign(defaultOptions, opts);
  getFiles(options.basePaths)
    .then(generateAllReferences)
    .then(sortReferences)
    .then(inject)
    .then(replaceInFile)
    .then(output)
    .catch(output);

}

function generateAllReferences(fileList) {

  var deferred = q.defer();
  var references = [];

  for (var i = fileList.length - 1; i >= 0; i--) {

    var type = fileList[i].substr(fileList[i].lastIndexOf('.') + 1);

    generateReference(type, fileList[i]).then(function(reference) {
      references.push(reference);
    });

  }

  deferred.resolve(references);

  return deferred.promise;

}

function generateReference(type, path) {

  var deferred = q.defer();

  // Build extra attributes
  var attributesString = '';
  if(options.attributes[type]) {
    for(var opt in options.attributes[type]) {
      if(options.attributes[type][opt] === true) {
        attributesString = attributesString + ' ' + opt;
      } else {
        attributesString = attributesString + ' ' + opt + '="' + options.attributes[type][opt] + '"';
      }
    }
  }

  if(type == 'js') {
    deferred.resolve({
      type: 'js',
      reference: '<script src="'+path+'"' + attributesString + '></script>\n'
    });
  }

  if(type == 'css') {
    deferred.resolve({
      type: 'css',
      reference: '<link href="'+path+'"' + attributesString + '>\n'
    });
  }

  return deferred.promise;

}

var getFilesDeferred,
    getFilesRemaining;

function getFiles(folders) {

  getFilesDeferred = q.defer();
  getFilesRemaining = folders.length;

  for (var i = folders.length - 1; i >= 0; i--) {

    var folderName = folders[i];

    (function(folderName) {

      fs.readdir(folderName, function(error, files) {

        if(error) {
          getFilesDeferred.reject(error);
        }

        if(typeof files != 'undefined') {
          listFiles(folderName, files);
        } else {
          getFilesDeferred.reject('No files in folder ' + folderName);
        }

      });

    })(folderName);

  }

  return getFilesDeferred.promise;

}

function inject(references) {

  var deferred = q.defer();

  fs.readFile(options.source, function(error, buffer) {

    if(error) {
      deferred.reject(error);
    }

    var sourceString = buffer.toString();
    var newSource = sourceString.replace(matchBlock, injectReplace);

    deferred.resolve(newSource);

  });

  return deferred.promise;

}

function injectReplace(match, prefix, type, suffix) {

  var matchedRefs = '';

  for (var i = sorted[type].length - 1; i >= 0; i--) {
    matchedRefs = matchedRefs + ' ' + sorted[type][i];
  }

  return (prefix) + matchedRefs.trim() + (suffix);
}

function listFiles(folderName, folderFiles) {

  for (var i = folderFiles.length - 1; i >= 0; i--) {

    getFilesRemaining--;
    fileList.push(folderName.replace(options.omit, '') + '/' + folderFiles[i]);

    if(getFilesRemaining === 0) {
      getFilesDeferred.resolve(fileList);
    }

  }

}

function output(error) {

  var totalTime = (performance() - start).toFixed(2);

  if(error) {
    console.log('AssetInjector'.underline.red, '-'.red, 'took '.red + totalTime.red + 'ms'.red);
    console.log('Error:'.red, error);
  } else {
    console.log('AssetInjector'.underline.green, '-'.green, 'took '.green + totalTime.green + 'ms'.green);
    console.log('Assets successfully injected into'.green, options.source.green);
  }

}

function replaceInFile(newSource) {

  var deferred = q.defer();

  fs.writeFile(options.source, newSource, {'encoding': 'utf8'}, function(error) {
    if(error) {
      deferred.reject('Error writing file ' + error);
    }
    deferred.resolve();
  });

  return deferred.promise;

}

function sortReferences(references) {

  var deferred = q.defer();

  for (var i = references.length - 1; i >= 0; i--) {
    sorted[references[i].type] = sorted[references[i].type] || [];
    sorted[references[i].type].push(references[i].reference);
  }

  deferred.resolve(sorted);

  return deferred.promise;

}
