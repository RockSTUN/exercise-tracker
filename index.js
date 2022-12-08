const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
mongoose.connect(process.env.URI);
app.use(bodyParser.urlencoded({extended: false}))

const UserSchema = mongoose.Schema({
    username: {type: String, required: true},
    log: []
})
const ExerciseSchema = mongoose.Schema({
    description:{type: String, required: true},
    duration:{type: Number, required: true},
    date: String
})

//MIDDLEMAN
async function handleUser(req,res,next){
    const USER = await User.findOne({username: req.body.username}).select({_id: 1}).exec();
    USER ? req.id = USER._id.toString(): null;
    next();
}

//

var User = mongoose.model('User',UserSchema);
var Exercise = mongoose.model('Exercise',ExerciseSchema);


app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users',handleUser, async function(req,res){
    if (req.id){
       res.json(await User.findById(req.id).select({username: 1, _id: 1}).exec()) 
    }
    else{
    let usr = new User({username: req.body.username});
    await usr.save()
    res.send(usr)
    }
    
})

app.post('/api/users/:_id/exercises',async function(req,res){
    const USER_ID = await User.findById(req.params._id).select({username: 1,_id: 1,log:1}).exec();
    if (USER_ID){
        const EXERCISE = new Exercise({
            description: req.body.description,
            duration: parseInt(req.body.duration),
            date: new Date(req.body.date ? req.body.date+'T12:00' : Date()).toDateString()
        })
        USER_ID.log.push({
            description: req.body.description,
            duration: parseInt(req.body.duration),
            date: new Date(req.body.date ? req.body.date+'T12:00' : Date()).toDateString()
        })
        await USER_ID.save()
        await EXERCISE.save()
      
        res.json({
            username: USER_ID.username,
            description: EXERCISE.description,
            duration: EXERCISE.duration,
            date: EXERCISE.date,
            _id: USER_ID._id.toString()
        })
    } 
    else{ 
//             
            res.send({
                username: null,
                description: req.body.description,
                duration: req.body.duration,
                date: new Date(req.body.date ? req.body.date : Date()).toDateString(),
                _id: req.params._id.toString()
            })
        }
    })



app.get('/api/users/:id/logs', handleUser, async function(req,res){
    
    function filterDates(exercise){
    const FROM = req.query.from ? new Date(req.query.from+'T12:00').getTime() : 0;
    const TO = req.query.to ? new Date(req.query.to+'T12:00').getTime() : new Date().getTime()+ 10**10;
    console.log('FROM: ',new Date(FROM).toDateString(), 'TO: ',new Date(TO).toDateString(), 'EXERCISE DATE: ', exercise.date)
        return (new Date(exercise.date).getTime() > FROM && new Date(exercise.date).getTime() < TO)
    
        
    
        
    }
    const USER_LOGS = await User.findById(req.params.id).select({log: 1}).exec();
    let LOGS_SEND = USER_LOGS.log.filter(filterDates)
    res.json({log: req.query.limit ? LOGS_SEND.slice(-parseInt(req.query.limit)) : LOGS_SEND, count: USER_LOGS.log.length})
})

app.get('/api/users', async function(req,res){
    res.send(await User.find().select('username').exec())
})



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})


