import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (Email, Subject, Message) => {
    try {
        const { data, error } = await resend.emails.send({
            from: process.env.EMAIL_FROM,
            to: [Email],
            subject: Subject,
            text: Message
        });

        if (error) {
            console.error("Resend error:", error);
            throw new Error(error.message);
        }

        console.log("Email sent successfully:", data.id);

        return data;

    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
};

export default sendEmail;