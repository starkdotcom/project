var db = require('../config/connection')
var collection = require('../config/collection')
const bcrypt = require('bcrypt')
const { resolve, reject } = require('promise')
const { ObjectID } = require('mongodb').ObjectID
const { response } = require('express')

module.exports = {
    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            let emailIdValid = await db.get().collection(collection.USER_COLLECTION).findOne({ "email": userData.email })
            let response = {}
            if (emailIdValid != null) {
                response.status = false
                resolve(response.status)
            }
            else {
                userData.password = await bcrypt.hash(userData.password, 10)
                await db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                    resolve(data.ops[0])
                })
            }
        })

    },
    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
            if (user) {
                bcrypt.compare(userData.password, user.password).then((status) => {
                    if (status) {
                        console.log("login success");
                        response.user = user
                        response.stat = true
                        resolve(response)
                    }
                    else {
                        console.log('login failed');
                        resolve({ status: false })
                    }
                })
            }
            else {
                console.log('login failled');
                resolve({ status: false })
            }
        })
    },
    addProfile:(userId,profile)=>{
        return new Promise(async(resolve,reject)=>{
        //userExist= db.get().collection(collection.PROFILE_COLLECTION).findOne({'user':ObjectID(userId)})
       // if(!userExist){
         db.get().collection(collection.PROFILE_COLLECTION).insertOne({'user':ObjectID(userId),'profile':profile}).then((response)=>{
            resolve()
            }).catch(()=>{
            reject()
            })
        })
    },
    editProfile:(userId,profile)=>{
        return new Promise(async(resolve,reject)=>{
        //userExist= db.get().collection(collection.PROFILE_COLLECTION).findOne({'user':ObjectID(userId)})
       // if(!userExist){
         db.get().collection(collection.PROFILE_COLLECTION).updateOne({'user':ObjectID(userId)}, 
         { $set:{
            'profile':profile,
            /*'profile':profile.lastname,  */              
            
        }}).then((response)=>{
            resolve()
            }).catch(()=>{
            reject()
            })
        })
    },
    addRecord:(userId,details)=>{

        //recdObj= details
        return new Promise(async (resolve, reject) => {
            var Record = await db.get().collection(collection.RECORD_COLLECTION).findOne({ user: ObjectID(userId) });
            if (Record) {
                //let recdExist = await db.get().collection(collection.RECORD_COLLECTION).findOne({ user: ObjectID(userId) ,'record': [details]})
                    db.get().collection(collection.RECORD_COLLECTION).updateOne({ user: ObjectID(userId) },
                        { $push: {record: details} }
                    ).then((response) => {
                        resolve(true)
                    })
                }
            else {
               RecdObj = {
                    user: ObjectID(userId),
                    record: [details]
                }
                db.get().collection(collection.RECORD_COLLECTION).insertOne(
                    RecdObj).then((response) => {
                        console.log(response)
                        resolve(true)
                    })
            }
        })
    },
    getRecord:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            db.get().collection(collection.RECORD_COLLECTION).findOne({'user':ObjectID(userId)}).then((response)=>{
                console.log("RESPONSE",response.record);
                    resolve(response.record)
            }).catch(()=>{
                reject()
            })
        })
    },
    getProfile:(userId)=>{
       // let userId=user._id
        return new Promise(async(resolve,reject)=>{
            db.get().collection(collection.PROFILE_COLLECTION).findOne({'user':ObjectID(userId)}).then((response)=>{
                console.log(response.profile);
                    resolve(response.profile)
            }).catch(()=>{
                reject()
            })
        })
    },
    /*addLink:(userId,dlink)=>{
        return new Promise(async(resolve,reject)=>{
            userLink=await db.get().collection(collection.DRIVE_COLLECTION).findOne({'user':userId})
            if(userLink){
                db.get().collection(collection.DRIVE_COLLECTION).updateOne({'user':userId,'driveLink':dlink}).then((response)=>{
                    console.log(response)
                    resolve()
                })  
            }
            else{
                db.get().collection(collection.DRIVE_COLLECTION).insertOne({'user':userId,'driveLink':dlink}).then((response)=>{
                console.log(response)
                resolve()
            })}
        })
    }*/
}