exports.Mail = (to, subject, body) => {
    const from = 'admin'
    console.log('E-MAIL:'.red.bold);
    console.log('From: '.green.bold + from.blue.bold);
    console.log('To: '.green.bold + to.blue.bold);
    console.log('Subject: '.green.bold + subject.blue.bold);
    console.log('Message: '.green.bold + body.blue.bold);
}
exports.SMS = (to, subject, body) => {
    console.log('SMS:'.red.bold);
    console.log('To: '.green.bold + to.blue.bold);
    console.log('Subject: '.green.bold + subject.blue.bold);
    console.log('Message: '.green.bold + body.blue.bold);
}