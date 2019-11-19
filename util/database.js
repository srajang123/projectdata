const sql=require('mysql2');
const pool=sql.createPool({
    host:'localhost',
    user:'srajan',
    password:'Project@123',
    database:'project'
});
module.exports=pool.promise();