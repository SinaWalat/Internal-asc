require('dotenv').config({ path: '.env.local' });
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: 'sinawalat021@gmail.com', // Using the user's email I saw earlier
  from: process.env.SENDGRID_FROM_EMAIL,
  subject: 'Test SendGrid Email',
  text: 'Testing SendGrid configuration',
  html: '<strong>Testing SendGrid configuration</strong>',
};

sgMail
  .send(msg)
  .then(() => {
    console.log('Email sent successfully');
  })
  .catch((error) => {
    console.error('Error sending email:', error);
    if (error.response) {
      console.error(error.response.body)
    }
  });
