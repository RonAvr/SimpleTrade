const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to:email,
        from:'eretzzavathalavumas@gmail.com',
        subject: 'Thanks for joining the App',
        text: `Welcome to the App, ${name}. Let me know how you get along with the app`
    })
}

const sendGoodbyeEmail = (email, name) => {
    sgMail.send({
        to:email,
        from:'eretzzavathalavumas@gmail.com',
        subject: 'Goodbye from the app',
        text: `We are sorry to see you leave, ${name}. Let us know if we could do something to make your expreience better`
    })
}


module.exports = {
    sendWelcomeEmail,
    sendGoodbyeEmail
}