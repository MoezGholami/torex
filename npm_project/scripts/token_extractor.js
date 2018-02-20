var fs = require('fs');
var obj = JSON.parse(fs.readFileSync('token_result.json', 'utf8'));
console.log(obj.token);
