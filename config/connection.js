const MongoClient = require('mongodb').MongoClient;
const state = {db:null};
module.exports.connect = function(done){
    const url = 'mongodb://localhost:27017';
    const dbname = 'corazon';

    MongoClient.connect(url,{useUnifiedTopology: true},(err,data)=>{
        if (err) return done(err)
        state.db = data.db(dbname)
        done();
    });
}
module.exports.get = function(done){
    return state.db
}