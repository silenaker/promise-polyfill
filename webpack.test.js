var path = require('path');
module.exports = {
    entry: './Promise.spec.js',
    output: {
        path: path.resolve(),
        filename: 'spec.js'
    }
}