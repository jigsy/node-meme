#!/usr/bin/env node

var meme = require('../lib/meme').client;
var format = require('sprintf').sprintf;
var ARGV = process.argv;

// print usage when no arguments are provided
if( ARGV.length < 3 ) {
    console.log("meme [GENERATOR|--list] LINE [ADDITIONAL_LINES]");
    process.exit();
}

if(/^(-v|(--)?version)$/.test( ARGV[2] )) {
    console.log( meme.version );
    process.exit();
}

// list available memes when asked for it
if( ARGV[2] === 'list') {
    for(var key in meme.templates) {
        m = meme.templates[key];
        var str = format("%-20s %-30s ", key, m.template_name);
        if(m.first_line)
            str += 'first line: '+m.first_line;
        console.log(str);
    }
    process.exit();
}

// if one wants to see what a given meme is
if(ARGV[2] === 'view') {
    var sym = ARGV[3];
    var name = meme.templates[sym].template_name;
    console.log('http://memegenerator.net/%s', name);
    process.exit();
}

var symbol = ARGV[2]; 
var text = ARGV.slice(3);
if(!(symbol in meme.templates)) {
    console.error('unknown meme %s',symbol);
    console.error('use `meme list` to see what is available');
    process.exit(1);
}

// add the callback as last arguments see last line
text.push(function callback(err, link) {
    if(err) {
        throw(err);
        process.exit(2); // useless as long as we keep throwing errors
    }
    console.log(link);
})

// this has to be the most complicated line of all this
// basically, find the function associated with a meme and call it
meme.templates[symbol].apply(null, text);
