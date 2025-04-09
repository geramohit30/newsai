const bcrypt = require('bcryptjs');
console.log(bcrypt.hashSync('yourpassword', 10));
