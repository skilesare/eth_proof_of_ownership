// copy this file into a directory as index.js
// from that directory run the following:
// npm install q
// npm install eth-lightwallet
// npm install ethereumjs-util
// npm install web3
//
// node index.js

var Q = require('q');  //I'm doing promises old school
var wal = require('eth-lightwallet'); //we will use this to generate some silly addresses
var utils = require('ethereumjs-util');  //we will use this to recover the address from our message
var Web3 = require('web3'); //we will use this to sha3 something

var web3 = new Web3();

var password = 'zzzzzzzzz'; //the password we will use to generate an ethereum address
var message = 'foobar';  //the message that we want to send

var keystore = null; //object created that holds our ethereum address that can sign things
var key = null; //the derived key from our wallet.
var addr1 = null; //the address of our account
var addr2 = null;
var sgnmsg = null; // the signed message

var createKeystore = function(){
 return Q.Promise(function (resolve,reject){
    //use eth-lightwallet to create a new ethererum address
    wal.keystore.createVault({password:password}, function(err,ks){
        keystore = ks;
        resolve(ks);
    });

  });
}

var generateKey = function(){
  return Q.Promise(function (resolve,reject){

    //get the key for the account.
    keystore.keyFromPassword(password,
      function (err, pwDerivedKey) {
          key = pwDerivedKey;
          if (err) throw err;

          //this gets us a valid address that matches our key
          // we get two addresses so we can test failure as well
          keystore.generateNewAddress(pwDerivedKey, 2);
          addr1 = keystore.getAddresses()[0];
          addr2 = keystore.getAddresses()[1];
          resolve();


          });
  });
}


var signSomething = function(the_addr){

  //use our keystore to sign a message with the address we created
  //this function sha3s our message for us and then signs it with our private key
  var foo = wal.signing.signMsg(keystore, key, message, the_addr);
  sgnmsg = foo;
}

var confirmAddress = function(the_addr){

  //these are variables that make sense to the encrption algo
  var r = sgnmsg.r;
  var s = sgnmsg.s;
  var v = sgnmsg.v;

  //we are going to re sha3 our message with a different library
  var m = utils.toBuffer(web3.sha3(message));


  var pub = utils.ecrecover(m, v, r, s);
  var sourceaddr = utils.pubToAddress(pub).toString('hex')
  if(sourceaddr == the_addr){
    console.log('Address 0x' + the_addr + ' owns this message.');
  } else {
    console.log('get out of town.  you dont own this');
  }



}

var run = function(){

  //our application

  createKeystore().then(generateKey).then( function(){
    //sign with address 1
    signSomething(addr1);

    //confirm that address 1 signed
    confirmAddress(addr1);

    //sign with address 2
    signSomething(addr2);

    //confirm that they don't match
    confirmAddress(addr1);
  });

}

run();


