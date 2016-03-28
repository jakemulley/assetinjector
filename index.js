'use strict';

// Required modules
var colors      = require('colors'),
    deepAssign  = require('deep-assign'),
    fs          = require('fs'),
    path        = require('path'),
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
  basePaths: [],
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

};

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
      reference: '<script src="'+path+'"' + attributesString + '></script>'
    });
  }

  if(type == 'css') {
    deferred.resolve({
      type: 'css',
      reference: '<link href="'+path+'"' + attributesString + '>'
    });
  }

  return deferred.promise;

}

var getFilesDeferred,
    getFilesRemaining;

function listFiles(folderName) {

  fs.readdir(folderName, function(error, files) {

    if(error) {
      getFilesDeferred.reject(error);
    }

    if(typeof files != 'undefined') {

      files.map(function(file) {
        return path.join(folderName, file);
      }).filter(function(file) {
        return fs.statSync(file).isFile();
      }).forEach(function(file) {

        fileList.push(file.replace(options.omit, ''));
        getFilesRemaining--;

        if(getFilesRemaining === 0) {
          getFilesDeferred.resolve(fileList);
        }

      });

    } else {

      getFilesDeferred.reject('No files in folder ' + folderName);

    }

  });

}

function getFiles(folders) {

  getFilesDeferred = q.defer();

  if(!folders.length) {
    getFilesDeferred.reject('No folders specified in your options.');
  } else {
    getFilesRemaining = folders.length;
  }

  for (var i = folders.length - 1; i >= 0; i--) {
    listFiles(folders[i]);
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

function output(error) {

  var totalTime = (performance() - start).toFixed(2);
  var introString = 'AssetInjector - took ' + totalTime + 'ms';

  if(error) {
    console.log(introString.red.underline);
    console.log('Error:'.red, error);
  } else {
    console.log(introString.green.underline);
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
