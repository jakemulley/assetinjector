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
var indent = /^\s*/gm;

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
  omit: '',
  source: ''
};

var options,
    listOfReferences = {},
    start;

module.exports = function(opts) {

  start = performance();

  options = deepAssign(defaultOptions, opts);
  getFiles(options.basePaths)
    .then(generateAllReferences)
    .then(inject)
    .then(replaceInFile)
    .then(output)
    .catch(output);

};

function generateAllReferences(files) {

  var deferred = q.defer();
  var fileCount = files.length;
  if(!fileCount) {
    deferred.reject('No files found to inject.');
  }

  files.forEach(function(file) {

    var fileDetails = path.parse(file);
    var ext = fileDetails.ext.substr(1);

    if(!listOfReferences[ext]) {
      listOfReferences[ext] = [];
    }

    listOfReferences[ext].push(generateReference(ext, file.replace(options.omit, '')));

    fileCount--;

    if(fileCount === 0) {
      deferred.resolve(listOfReferences);
    }

  });

  return deferred.promise;

}

function generateReference(type, path) {

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
    return '<script src="'+path+'"' + attributesString + '></script>';
  }

  if(type == 'css') {
    return '<link href="'+path+'"' + attributesString + '>';
  }

}

function getFiles(folders) {

  var deferred = q.defer();
  var folderCount = folders.length;
  var listOfFiles = [];
  if(!folderCount) {
    deferred.reject('No folders specified.');
  }

  folders.forEach(function(folder) {

    fs.readdir(folder, function(error, files) {

      if(error) {
        deferred.reject(error);
      }

      files.map(function(file) {
        return path.join(folder, file);
      }).filter(function(file) {
        return fs.statSync(file).isFile();
      }).filter(function(file) {
        var fileDetails = path.parse(file);
        return (fileDetails.ext != '.css' && fileDetails.ext != '.js') ? false : true;
      }).forEach(function(file) {
        listOfFiles.push(file);
      });

      folderCount--;

      if(folderCount === 0) {
        deferred.resolve(listOfFiles);
      }

    });

  });

  return deferred.promise;

}

function getIndentation(str) {
  return str.match(indent)[1];
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
  var indentation = getIndentation(match) ? getIndentation(match) : '    ';

  if(typeof listOfReferences[type] !== 'undefined') {

    listOfReferences[type].forEach(function(reference) {
      matchedRefs = matchedRefs + '\n' + indentation + reference;
    });

  }

  return (prefix) + '\n' + indentation + matchedRefs.trim() + '\n' + indentation + (suffix);

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
