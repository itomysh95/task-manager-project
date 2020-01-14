const express = require('express')
const User = require('../models/user.js')
const router = new express.Router()
router.use(express.json())
const auth = require('../middleware/auth.js')
const multer = require('multer')
const sharp = require('sharp')
const { sendWelcomeEmail,sendAccountCloseEmail } = require('../emails/account.js')

const upload = multer({
    limits:{
        fileSize: 1000000,
    },
    fileFilter(req,file,cb){
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
            return cb(new Error('Please upload a valid jpg,jpeg or png file'))
        }
        cb(undefined,true)
    }
})

// create a new user
router.post('/users', async(req,res)=>{
    const user = new User(req.body)
    try{
        await user.save()
        sendWelcomeEmail(user.email,user.name)
        const token = await user.generateAuthToken()
        res.status(201).send({user,token})
    }catch(error){
        res.status(500).send(error)
    }
})

//  get current user
router.get('/users/me', auth ,async (req,res)=>{
    res.send(req.user)
})


// delete the user profile
router.delete('/users/me', auth, async (req,res)=>{
    try{
        sendAccountCloseEmail(req.user.email,req.user.name)
        await req.user.remove()
        res.send(req.user)
    }catch(error){
        res.status(500).send(error)
    }
})

// update the user profile
router.patch('/users/me', auth, async (req,res)=>{
    // get the keys (the updates user wants to apply on) from request body
    const updates = Object.keys(req.body)
    // make an array of strings that we allow for updates
    const allowedUpdates = ['name','email','password','age']
    // returns true only if EVERY object follows the condition (if 
    // every item in the update array is included in allowed updates)
    const isValidOperation = updates.every((update)=>allowedUpdates.includes(update))

    if(!isValidOperation){
        return res.status(400).send({error:"invalid updates!"})
    }

    try{
        // find the user by id paramter, set the changes as the body of request, new-> return the updated user instead of
        // old user, validator => run validator on the update
        // const user = await User.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true})
        
        // need to use this to use mongoose middlware?
        const user = req.user
        updates.forEach((update)=>user[update] = req.body[update])
        await user.save()

        if(!user){
            return res.status(404).send()
        }
        res.send(user)
    }catch(error){
        res.status(400).send(error)
    }
})

router.post('/users/login', async(req,res)=>{
    try{
        // User -> entire collection(database) of users 
        const user = await User.findByCredentials(req.body.email,req.body.password)
        // user -> specific user that we're working on
        // generate the token for the user
        const token = await user.generateAuthToken()
        res.send({user,token})
    }catch(error){
        res.status(400).send()
    }
})

router.post('/users/logout',auth,async(req,res)=>{
    try{
        req.user.tokens = req.user.tokens.filter((token)=>{
            // if the token is not the same token as the one being logged out of
            // then we filter that token out by returning false
            return token.token !== req.token
        })
        // save changes 
        await req.user.save()
        res.send("You are now logged out")
    }catch(error){
        res.status(500).send()
    }
})

router.post('/users/logoutAll',auth,async(req,res)=>{
    try{
        // empty the tokens list for the user
        req.user.tokens = []
        await req.user.save()
        res.send("all your accounts are now logged out")
    }catch(error){
        res.status(500).send()
    }
})


router.post('/users/me/avatar', auth, upload.single('avatar'), async (req,res)=>{
    // resize the image to 250x250, change the file type to png then change it back to buffer
    const buffer = await sharp(req.file.buffer).resize({width:250,height:250}).png().toBuffer()
    // when we don't have dest option setup, then multer passes the
    // file to the function on req.file
    req.user.avatar = buffer
    await req.user.save()
    res.send()
},(error, req,res,next)=>{
    res.status(400).send('Please upload a correct avatar file type')
})
module.exports = router


router.delete('/users/me/avatar',auth, async(req,res)=>{

    req.user.avatar = undefined
    await req.user.save()
    res.sendStatus(200)
})


router.get('/users/:id/avatar', async (req,res)=>{
    try{
        const user = await User.findById(req.params.id)

        // if the user or avatar does not exist
        if(!user || !user.avatar){
            throw new Error()
        }


        res.set('Content-Type','images/png')
        res.send(user.avatar)
    }catch(error){
        res.sendStatus(404)
    }
})