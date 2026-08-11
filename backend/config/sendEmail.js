import nodemailer from "nodemailer"


const sendEmail = async (Email, Subject, Message) => {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        tls: {
            rejectUnauthorized: true
        }
    })


    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: Email,
        subject: Subject,
        text: Message
    }


    try {
        await transporter.sendMail(mailOptions)
        console.log("Email sent successfully")
    }
    catch(error) {
        console.log("Error sending email", error)
    }
}


export default sendEmail
