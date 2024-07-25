// ! IMPORT REQUIREMENTS ! \\
const express = require("express")
const cookieParser = require("cookie-parser")
const app = express()
const mongoose = require('mongoose')
const bcryptjs = require('bcryptjs')




// ! CONNECT MONGO DB ! \\
mongoose.connect('DATABASE STRING COMES HERE')
.then(()=>{
  console.log(`DataBase Is Connected`);
})
.catch((error)=>{
  console.log(error);
})


// ! CREATE USER SCHEMA ! \\
const userSchema = new mongoose.Schema({
  username:String,
  password:String,
  role:{
    type:String,
    default:'user',
  }
})


// ! COMPILE THE SCHEMA TO FORM MODEL ! \\

const User = mongoose.Model('User',userSchema)



// ! MIDDLEWARES ! \\
app.use(express.json())
app.use(cookieParser())



// ! CUSTOM MIDDLEWARES ! \\

// * isAuthenticated Middleware * \\
const IsAuthenticated = (req,res,next) => {

  // ? Check The User In The Cookies ? \\
    const UserDataCookie = req.cookies.userData

  try {
    const UserData = UserDataCookie && JSON.parse(UserDataCookie)
    
    if(userData && userData.username){
      // ? Add The Log In User To The Req Object ? \\
      req.userData = userData
      
      return next()
    }else{

      res.send('Only Admin Can See This Page! ')

    }
  } catch (error) {
    console.log(error);
  }

}


// * isAdmin Middleware For Authorization * \\
const isAdmin = (req,res,next) => {

  if(req.userData && req.userData.role === 'admin'){

    return next()

  }else{

    res.send('You Dont Have Authorization To See This Page! Only Admins Can React This Page! ')

  }

}



// ! HOME ROUTE ! \\
app.get("/", (req, res) => {
  
    res.json({message:'Welcome To The API !'})

})


// ! LOGIN ROUTE(login form) ! \\
app.get('/login',(req,res)=>{
  res.render('login')
})


// ! ADMIN ROUTE(admin page) ! \\
app.get('/admin-page',IsAuthenticated,isAdmin,(req,res)=>{
  // * We Have Access To The Login User As req.userData * \\
  res.render('admin')
})


// ! REGISTER ROUTE(register form) ! \\
app.get('/register',(req,res)=>{
  res.render('register')
})



// ! REGISTER LOGIC ! \\
app.post('/register', async (req,res)=>{
  // ? Destructure The req.body ? \\
  const {username,password} = req.body
  
  const hashedPassword = await bcryptjs.hash(password,10)

  await User.create({
    username,
    password:hashedPassword,
  })
  // ? Redirect To Login ? \\
  res.redirect('/login')
})



// ! LOGIN ROUTE LOGIC ! \\
app.post("/login", async (req, res) => {
  
  // ? Find the user in DataBase ? \\
  const {username,password} = req.body
  
  // ? Find The User In The DataBase ? \
  const UserFound = await User.findOne({
    username
  })

  if(userFound && await bcryptjs.compare(password,userFound.password)){

    //? Create some cookies (cookie) ? \\
    //* Prepare the login user data * \\
    //? Setting the cookie with the userdata
 res.cookie("userData", JSON.stringify({
  username:userFound.username,role:userFound.role
 }), {
    maxAge: 7 * 24 * 60 * 1000, //7 DAYS EXPIRING TIME
    httpOnly: true,
    secure: false,
    sameSite: "strict",
  })

    res.redirect('/dashboard')

  }else{
    res.send('Invalid Login Details! ')
  }

})



// ! DASHBOARD ROUTE ! \\
app.get("/dashboard", (req, res) => {
  // ? GRAB USER FROM COOKIE ? \\
  const userData = req.cookies.userData ? JSON.parse(req.cookies.userData) : null

  const username = userData ? userData.username : null
  
  // ? RENDER THE TEMPLATE ? \\
  if (username) {

    res.json({
      message:`Welcome Dear ${username} , role : ${userData.role}`
    })
  
    } else {
    // ? REDIRECT TO LOGIN ? \\

    res.json({
      message:'Please Login First! '
    })
  
  }
})

// ! LOGOUT ROUTE ! \\
app.get("/logout", (req, res) => {

    // ? LOGOUT ? \\
  res.clearCookie("userData")
  
    // ? REDIRECT LOGIN ? \\
  res.json({
    message:'Logged Out Successfully! '
  })

})

// ! START THE SERVER ! \\
app.listen(3001, console.log(`The server is running`))