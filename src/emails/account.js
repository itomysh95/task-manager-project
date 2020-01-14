const sgMail = require('@sendgrid/mail')


sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) =>{
    sgMail.send({
        to: email,
        from: 'thomas_h@live.ca',
        subject: 'Welcome to the site',
        text: `Welcome to the app, ${name}. Hope you enjoy the app.`
    })
}


const sendAccountCloseEmail = (email,name)=>{
    sgMail.send({
        to:email,
        from:'Thomas_h@live.ca',
        subject: 'Sorry to see you go!',
        text: `Sorry to see you go, ${name}! Hope you return soon!`
    })
    console.log('test')
}

module.exports = {
    sendWelcomeEmail,
    sendAccountCloseEmail
}