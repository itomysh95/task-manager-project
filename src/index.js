const express = require('express')
require('./db/mongoose.js')
const userRouter = require('./router/user.js')
const taskRouter = require('./router/task.js')

const app = express()
const port = process.env.PORT


app.use(userRouter)
app.use(taskRouter)
app.use(express.json())



app.listen(port, ()=>{
    console.log('Server is up on port ' + port)
})
