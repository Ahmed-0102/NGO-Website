require('dotenv').config();
const express = require("express");
const app = express();
const path = require("path");
const hbs = require("hbs");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
    key_id : process.env.razor_id,
    key_secret : process.env.razor_secret_key,
})

require("./db/conn");
const User = require("./models/signup");
const DataEvent = require("./models/event");
const {verifyEmail} = require("./middleware/JWT")

const port = process.env.PORT || 3000;

const static_path = path.join(__dirname, "../public");
const template_path = path.join(__dirname, "../templates/views");
const partials_path = path.join(__dirname, "../templates/partials");

app.use(express.json());
app.use(express.urlencoded({extended:false}));

app.use(express.static(static_path));
app.set("view engine", "hbs");
app.set("views", template_path);
hbs.registerPartials(partials_path);

app.get("/", (req, res) => {
    res.render("index");
})

app.get("/donation", (req, res) => {
    res.render("donation");
})

app.get("/login", (req, res) => {
    res.render("login");
})

app.get("/about-us", (req, res) => {
    res.render("about-us");
})

app.get("/volunteer", (req, res) => {
    res.render("volunteer");
})

app.get("/admin", (req, res) => {
    res.render("admin");
})


const createDocument = async () =>{
    try{
        const firstEvent1 = new DataEvent({
            name : "World Humanitarian Day",
            date : new Date("2020-07-19"), //   yyyy-mm-dd
            description : "COVID-19 is currently the biggest challenge to humanity around the world. On World Humanitarian Day, through our campaign, ‘Hope For Humanity’ we want to highlight stories of hope and show how every act of kindness is part of a bigger global movement made up of people from all disciplines and walks of life, who step up to show solidarity and help their fellow humans when times are tough.We will highlight the Real-life Heroes working amongst us to help build a better world. They are unsung heroes who battle COVID-19, floods, droughts, locusts and many other challenges. Real humanitarian workers’ lives are tough but they stay the course. Look out for inspiring stories and information on our social media platform.",
            eventNo : 1
        })
        
        const firstEvent2 = new DataEvent({
            name : "Do a good deed, help those in need",
            date : new Date("2020-10-02"), //  02-10-2020,
            description : "Like every year, it is time to celebrate the ‘ Joy of Giving Week’ or ‘ Daan Utsav’ , from October 2 to 8. This is India’s biggest giving festival during which people and organisations come together and perform acts of kindness towards causes of their choice. This year the DAAN UTSAV takes a whole new dimension, on account of the devastating impact the COVID – 19 pandemic has had the world over. We need to come together this year, as never before to bring succor and happiness to the lives of those who need help the most. By joining our ‘Joy of Giving’ campaign, you can help marginalised women and girls. Be an author of change.",
            eventNo : 2
        })
        
        const firstEvent3 = new DataEvent({
            name : "Celebrating Women in Leadership on the International Women’s Day 2021",
            date : new Date("2021-02-24"),    //24-02-2021,
            description : "When equipped with the proper resources, women have the power to help whole families and entire communities overcome poverty, marginalisation and social injustice.Let’s celebrate the tremendous efforts by women and girls around the world in shaping a more equal future and recovery from the COVID-19 pandemic. International Women’s Day is an opportunity for us to show solidarity with champions of women’s equality and reaffirm our commitment to the cause of empowering marginalised women and girls. We believe we can become a champion for more women in leadership, for having more women in leadership will bring the changes in our society that we wish to see. CARE India will be celebrating International Women’s Day 2021 throughout the month of March under the campaign – March4Women",
            eventNo : 3
        })
        const result = DataEvent.insertMany([firstEvent1,firstEvent2,firstEvent3]);

    }catch(err){
        console.log(err);
    }
}

// createDocument();

app.get("/event", (req, res) => {
    DataEvent.find({},function(err,data){
        if(err) console.log("Error at 91");
        res.render("event",{

            output : data,
            
        });
        //console.log(data);
    }) 
})


app.post('/order', (req,res) => {
    var options = {
        amount: 5000,  // amount in the smallest currency unit
        currency: "INR",
        receipt: "order_rcptid_11"
    };

    razorpay.orders.create(options, function (err, order) {
        console.log(order);
        res.json(order);
    })
})


app.post('/is-order-complete', (req,res) => {
    razorpay.payments.fetch(req.body.razorpay_payment_id).then((paymentDocument) => {
        if(paymentDocument.status == 'captured') {
            res.send('Payment successful')
        } else {
            res.redirect('donation');
        }
    })
})



// login check
app.post("/index",verifyEmail, async(req,res) => {
    try {
        const email = req.body.email;
        
        const password = req.body.password;

        const useremail = await User.findOne({email:email});

        const isMatch = await bcrypt.compare(password, useremail.password);

        const token = await useremail.generateAuthUser();
        console.log("The token part is " + token);

        if(isMatch) {
            res.status(201).render("index");
        }else {
            res.send("Invalid credentials")
        }
        
    } catch (error) {
        res.status(400).send("Error");
    }
})


var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.password
    },
    tls: {
        rejectUnauthorized: false
    }
})







// create new user
app.post("/login", async(req,res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        const cpassword = req.body.cpassword;

        let pattern = /^[A-Za-z0-9._]{3,}@[A-Za-z]{3,}[.]{1}[A-Za-z.]{2,6}$/;
        let passwordpattern = /^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9]{6,16}/;

        if(pattern.test(email)) {
            if(passwordpattern.test(password)) {

                if(password === cpassword) {
                    
                    const newUser = new User({
                        email,
                        password,
                        // cpassword,
                        emailToken: crypto.randomBytes(64).toString('hex'),
                        isVerified: false
                    })
                    console.log("1");
                    console.log("The success part " + newUser);

                    const token = await newUser.generateAuthUser();
                    console.log("The token part is" + token);

                    res.cookie("jwt", token, {
                        httpOnly:true
                    });
                    
                    const registered = await newUser.save();

                    var mailOptions = {
                        from: ' "kjai4101@gmail.com',
                        to: email,
                        subject: 'kunaljain -verify your email',
                        text: `<h2> ! Thanks for registerating with our NGO</h2>
                                <h4> Please verify your mail to continue...</h4>
                                <a href=""http://${req.headers.host}/verify-email?token=${newUser.emailToken}">Verify your Email</a>`
                    };

                    // sending mail
                    transporter.sendMail(mailOptions, function(error, info){
                        if(error) {
                            console.log(error);
                        }
                        else {
                            console.log("Verification email is sent to your gmail account");
                        }
                    })

                    res.status(201).render("index");
                } else {
                    res.send("Enter same password");
                }
            } else {
                res.send("Enter correct password")
            }
        } else {
            res.send("Enter correct Email ID")
        }
    } catch (error) {
        res.status(400).send(error);
    }
})

app.get('/verify-email', async(req,res) => {
    try {
        const token = req.query.token;
        User.updateMany(
            {emailToken : token},
            {emailToken : null,
            isVerified : true},
            function(error, result) {
                if(error) {
                    res.json({
                        status: false
                    })
                }
                res.render('login')
            }
        )
    } catch (error) {
        console.log(error);
    }
})

app.listen(port, () => {
    console.log(`Listening on port number ${port}`);
})