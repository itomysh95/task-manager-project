const express = require('express')
const Task = require('../models/task.js')
const router = new express.Router()
const auth = require('../middleware/auth')
router.use(express.json())

// GET /tasks?completed=true
// GET /tasks?limit=10&skip=20 -> show only 10 results at a time, skips first 20 ie show result
// #30 to #40
// GET /tasks?sortBy=createdAt:desc
router.get('/tasks', auth, async (req,res)=>{
    const match={}
    const sort = {}
    if(req.query.completed){
        // query is a string, we want a boolean, so compare query string
        // to 'true' string
        match.completed_fields = req.query.completed === 'true'
    }
    if(req.query.sortBy){
        const parts = req.query.sortBy.split(':')
        // terniary operator, (the condition ? value is true (-1) : value is false (1))
        sort[parts[0]] = parts[1]==='desc' ? -1 : 1
    }
    try{
        await req.user.populate({
            path:'tasks',
            match,
            options:{
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            },
        }).execPopulate()
        res.send(req.user.tasks)
    }catch(error){
        res.status(500).send()
    }
})

// get a task by id
router.get('/tasks/:id', auth, async (req,res)=>{
    const _id = req.params.id
    try{
        // task = await Task.findById(_id)
        const task = await Task.findOne({_id, owner: req.user._id})
        if(!task){
            return res.status(404).send()
        }
        res.send(task)
    }catch(error){
        res.status(500).send()
    }
})

// create a new task
router.post('/tasks', auth, async (req,res)=>{
    const task = new Task({
        // spreads everything from body of requests to this object
        ...req.body,
        // add the user id to this task
        owner: req.user._id,
    })
    try{
        await task.save()
        res.status(201).send(task)
    }catch(error){
        res.status(500).send()
    }
})

// delete a task by id
router.delete('/tasks/:id', auth, async (req,res)=>{
    try{
        const task = await Task.findOneAndDelete({_id:req.params.id,owner:req.user._id})
        if(!task){
            return res.status(404).send()
        }
        res.send(task)
    }catch(error){
        res.status(500).send(error)
    }
})

// update a task by id
router.patch('/tasks/:id', auth, async(req,res)=>{
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description','completed_fields']
    const isValidOperation = updates.every((updates)=>allowedUpdates.includes(updates))
    if(!isValidOperation){
        return res.status(400).send({error:"invalid updates!"})
    }   
    try{
        // const task = await Task.findByIdAndUpdate(req.params.id,req.body,{new:true,runValidators:true})
        const task = await Task.findOne({_id: req.params.id, owner:req.user._id})
        if(!task){
            return res.status(404).send()
        }
        updates.forEach((update)=>task[update] = req.body[update])
        await task.save()
        res.send(task)
    }catch(error){
        res.status(500).send(error)
    }
})

module.exports = router