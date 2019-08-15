const express=require('express');
const graphqlHttp=require('express-graphql');
const {buildSchema}=require('graphql')
const mongoose=require('mongoose');
const config=require('config');
const bodyParser=require('body-parser');
const Event=require('./models/event.js')
const User=require('./models/user.js');
const bcrypt=require('bcryptjs');
const app=express();

app.use(bodyParser.json())

const userX=userId=>{
    return User.findById(userId)
        .then(user=>{
            return {...user._doc,_id:user.id,createdEvents:eventX.bind(this,user._doc.createdEvents)}
        })
        .catch(err=>{
            throw err
        })
}

const eventX=eventId=>{
    return Event.find({_id:{$in:eventId}})
        .then(events=>{
            return events.map(event=>{
                return{...event._doc,_id:event.id,creator:userX.bind(this,event.creator)}
            })
        })
        .catch(err=>{throw err})
}

app.use('/graphql',graphqlHttp({
    schema:buildSchema(`
        type Event{
            _id:ID!
            title:String!
            description:String!
            price:Float!
            date:String!
            creator:User!
        }
        type User{
            _id:ID!
            email:String!
            password:String
            createdEvents:[Event!]
        }

        input EventInput{
            title:String!
            description:String!
            price:Float!
            date:String!
        }

        input UserInput{
            email:String!
            password:String!
        }

        type RootQuery {
            events:[Event!]!
            users:[User!]!
        }

        type RootMutation{
            createEvent(eventInput:EventInput):Event
            createUser(userInput:UserInput):User
        }

        schema{
            query:RootQuery
            mutation:RootMutation
        }
    `),
    rootValue:{
        events:()=>{
            return Event
                .find()
                //To ask mongoose to get user data in creator field
                .then(events=>{
                    console.log(events)
                    return events.map(event=>{
                        return{...event._doc,
                                _id:event.id,
                                creator:userX.bind(this,event._doc.creator)}
                        //_id in mongoDB is object, in graphql is String, 
                        //so mongoose change object to string by "event.id"
                        //return{...event._doc,_id:event._doc._id.toString()}
                    })
                })
                .catch(err=>{
                    console.log(err);
                    throw err;
                });
        },

        createEvent:(args)=>{
            const event=new Event({
                title: args.eventInput.title,
                description: args.eventInput.description,
                price: +args.eventInput.price, //cast from string to number
                date: new Date(args.eventInput.date),
                creator:"5cf73f9b366ef615bff05381"//Now when create event , we put user id too 
            })
            let createdEvents;
            return event //This is async please wait until complete
                .save()
                .then(result=>{
                    //then of event.save
                    createdEvents={...result._doc,_id:result._doc._id.toString()}
                    //Need createdEvents for return to graphql
                    return User.findById("5cf73f9b366ef615bff05381")
                    //find the user
                })
                .then(user=>{ 
                    //then of User.findById
                    //Need to put eventobject in User.createdEvents which is an array as well
                    if(user){
                        user.createdEvents.push(event)
                        return user.save();
                    }
                    else{
                        throw new Error('User not found')
                    }
                })
                .then(m=>{
                    //then of user.save
                    return createdEvents
                    //Need to return to graphql 
                })
  
                .catch(err=>{
                    console.log(err);
                    throw err;
                });
        },
        users:()=>{
            return User
                    .find()
                    .then(users=>{
                        console.log(users)
                        return users.map(user=>{
                            return{...user._doc,_id:user.id,password:null,createdEvents}
                            //_id in mongoDB is object, in graphql is String, 
                            //so mongoose change object to string by "user.id"
                            //return{...user._doc,_id:user._doc._id.toString()}
                        })
                    })
                    .catch(err=>{
                        console.log(err);
                        throw err;
                    });
        },

        createUser:(args)=>{
            return User
                .findOne({email:args.userInput.email})
                //prevent the same user happen
                .then(user=>{
                    if(user){
                        throw new Error('User exists already')
                    }
                    
                    return bcrypt//please wait for brcrypt
                        .hash(args.userInput.password,12);
                    
                })
                .then(hashedPassword=>{
                    //then of brypt
                    const user=new User({
                        email:args.userInput.email,
                        password:hashedPassword
                    });
                    return user.save();
                })
                .then(result=>{
                    //then of save
                    return {...result._doc,_id:result.id,pasword:null}
                })
                .catch(err=>{throw err});


            
        }
    },
    graphiql:true

}))


//DB Config
//const db=require('./config/keys').mongoURI;
const db=config.get('mongoURI');
//Connect to Mong
mongoose
  .connect(db,{
     useNewUrlParser:true,
     useCreateIndex:true 
  })
  .then(()=>{
    console.log('MongoDB connected')
    app.listen(3000,()=>{console.log("server running")});
    })
  .catch(err=>console.log(err));



/*
https://www.youtube.com/watch?v=WcyYYD5xkuQ&list=PL55RiY5tL51rG1x02Yyj93iypUuHYXcB_&index=8


git init
git add README.md
git commit -m "first commit"
git remote add origin https://github.com/nikhomgithub/academindgraphql.git
git push -u origin master
//How to check result
http://localhost:3000/graphql

press F12, console
type  >>>   new Date().toISOString()
"2019-06-04T07:55:04.316Z" >> take this to use date


query{
  users{
    _id
    email
    password
  }
}

{
  "data": {
    "users": [
      {
        "_id": "5cf73f9b366ef615bff05381",
        "email": "nik@mail.com",
        "password": null
      },
      {
        "_id": "5cf745931f489e16c31fb9bd",
        "email": "peter@mail.com",
        "password": null
      }
    ]
  }
}




mutation{
  createEvent(eventInput:{title:"Test",description:"Test Test",price:100,date:"2019-06-04T07:55:04.316Z"}){
    title
    description
    price
    date
  }
}
//====================
{
  "data": {
    "createEvent": {
      "title": "Test",
      "description": "Test Test",
      "price": 100,
      "date": "1559634904316"
    }
  }
}
//====================
//====================

query{
  events{
    _id
    title
    description
    price
    date
  }
}
//=======================
{
  "data": {
    "events": [
      {
        "_id": "5cf62dd94444801702905adf",
        "title": "Test",
        "description": "Test Test",
        "price": 100,
        "date": "1559634904316"
      }
    ]
  }
}

//=======================
query{
  events{
    creator{
    	email
      createdEvents{
        _id
        date
        creator{
          email
        }
      }
    }
  }
}
//===========================
{
  "data": {
    "events": [
      {
        "creator": {
          "email": "nik@mail.com",
          "createdEvents": [
            {
              "_id": "5cf75627ee3cae1bfc2dbbcb",
              "date": "1559634904316",
              "creator": {
                "email": "nik@mail.com"
              }
            }
          ]
        }
      }
    ]
  }
}








*/