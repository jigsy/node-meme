(function() {
  var http = require('http');
  var fs = require('fs');
  var qs = require('querystring');
  var URL = require('url');

  var types = {
    adv: 'AdviceDogSpinoff',
    vert: 'Vertical'
  }

  function fetch (data, callback) {
    var url = URL.parse('http://memegenerator.net/' + data.generatorName + '/caption')
    var post = qs.stringify(data); // stringify into urlencoded
    var options = {
      host: url.hostname,
      port: url.port || 80,
      path: url.pathname,
      method: 'POST',
    };
    options.headers = {'Content-Type': 'application/x-www-form-urlencoded'};
    var req = http.request(options);
    // send all errors to the global handler
    req.on('error', callback);
    req.on('response', function(res) {
      res.setEncoding('utf8');
      if(res.statusCode !== 302) return callback(new Error("Got error "+res.statusCode));
      if(!res.headers.location) return callback(new Error("No location header"));

      callback(null, 'http://images.memegenerator.net/instances/400x/'+res.headers.location.split('/')[2]+'.jpg');
    });
    req.end(post+'\n');
  }

  /**
   * Factory for creating MEME templates
   * @returns a function that accepts the text to generate the meme
   */
  function memeFactory (type, id, template_name, first_line) {
    var res = function(line1, line2) {
      var cb = [].pop.call(arguments);
      // construct the data to post
      var data = {
        generatorId: 2, // memegenerator doesn't seem to care about this!
        generatorName: template_name,
        imageId: id,
        languageCode: 'en'
      };
      // add the default first line as first argument
      if(first_line && !line2) [].unshift.call(arguments, first_line);

      for (var i = 0; i < arguments.length; ++i) {
          data['text'+i] = arguments[i];
      };
      fetch(data, cb);
    }
    // attach some data to help displaying lists
    res.id = id;
    res.template_name = template_name;
    res.first_line = first_line;
    return res
  }

  function parseMemes (factory) {
    var result = {};
    var raw = fs.readFileSync(__dirname+'/../data/memes.csv', 'utf8');
    var split = raw.split(/\r\n|\r|\n/gm);
    for (var i = 0; i < split.length; ++i) {
        var line = split[i].split(',');
        if(line.length < 4) continue;
        var type = line.shift().trim();
        for (var j = 0; j < line.length; ++j) {
            try {
                line[j] = JSON.parse(line[j]);
            }
            catch(e) {
                console.error('failed to parse %s', line[j]);
                throw(e);
            }
        };
        var name = line.shift();
        line.unshift(type);
        result[name] = factory.apply(null, line);
    };
    return result;
  }

  exports.client = {
    version: '0.1.2',
    templates: parseMemes(memeFactory)
  }

})();
