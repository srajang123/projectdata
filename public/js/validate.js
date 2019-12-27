if (document.forms['loginForm'])
    document.forms['loginForm'].onsubmit = () => { return login() }
if (document.forms['adminLoginForm'])
    document.forms['adminLoginForm'].onsubmit = () => { return adminLogin() }
if (document.forms['adminSignupForm'])
    document.forms['adminSignupForm'].onsubmit = () => { return adminSignup() }
if (document.forms['signupForm'])
    document.forms['signupForm'].onsubmit = () => { return signup() }
window.onload = () => {
    if (document.querySelector('.error').innerHTML) {
        error(document.querySelector('.error').innerHTML);
    }
}

function login() {
    let type = document.querySelector('#type').value;
    let mail = document.querySelector('#email').value;
    let pass = document.querySelector('#password').value;
    if (type == '-1')
        return error('Please select Profile');
    else if (mail == '')
        return error('Please enter e-mail');
    else if (pass == '')
        return error('Please provide your password');
    else {
        if (!mail.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/))
            return error('Invalid E-mail');
    }
    return true;
}

function adminLogin() {
    let mail = document.querySelector('#email').value;
    let pass = document.querySelector('#password').value;
    if (mail == '')
        return error('Please enter e-mail');
    else if (pass == '')
        return error('Please provide your password');
    else {
        if (!mail.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/))
            return error('Invalid E-mail');
    }
    return true;
}

function signup() {
    let type = document.querySelector('#type').value;
    let fname = document.querySelector('#fname').value;
    let lname = document.querySelector('#lname').value;
    let gen = document.querySelector('#gender').value;
    let contact = document.querySelector('#contact').value;
    let mail = document.querySelector('#email').value;
    let pass = document.querySelector('#password').value;
    let cpass = document.querySelector('#conpassword').value;
    if (type == '-1')
        return error('Please select Profile');
    else if (fname == '')
        return error('Please provide First Name');
    else if (lname == '')
        return error('Please provide Last Name');
    else if (gen == '-1')
        return error('Please select your gender');
    else if (contact == '-1')
        return error('Please provide your contact number');
    else if (mail == '')
        return error('Please enter e-mail');
    else if (pass == '')
        return error('Password cannot be empty');
    else if (cpass != pass)
        return error('Confirm Password should be same as Password');
    else if (!contact.match(/^\d{10}$/))
        return error('Invalid Contact number');
    else if (!mail.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/))
        return error('Invalid E-mail');
    else if (!pass.match(/^[A-Za-z]\w{7,14}$/))
        return error('Password format error');
    return true;
}

function adminSignup() {
    let fname = document.querySelector('#fname').value;
    let lname = document.querySelector('#lname').value;
    let gen = document.querySelector('#gender').value;
    let contact = document.querySelector('#contact').value;
    let mail = document.querySelector('#email').value;
    let pass = document.querySelector('#password').value;
    let cpass = document.querySelector('#conpassword').value;
    if (fname == '')
        return error('Please provide First Name');
    else if (lname == '')
        return error('Please provide Last Name');
    else if (gen == '-1')
        return error('Please select your gender');
    else if (contact == '-1')
        return error('Please provide your contact number');
    else if (mail == '')
        return error('Please enter e-mail');
    else if (pass == '')
        return error('Password cannot be empty');
    else if (cpass != pass)
        return error('Confirm Password should be same as Password');
    else if (!contact.match(/^\d{10}$/))
        return error('Invalid Contact number');
    else if (!mail.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/))
        return error('Invalid E-mail');
    else if (!pass.match(/^[A-Za-z]\w{7,14}$/))
        return error('Password format error');
    return true;
}

function error(msg) {
    let err = document.querySelector('.error');
    err.style.visibility = 'visible';
    err.innerHTML = msg;
    err.style.opacity = 1;
    setTimeout(() => {
        let a = setInterval(() => {
            err.style.visibility = 'visible';
            err.style.opacity = Number(err.style.opacity) - 0.1;
            if (err.style.opacity == 0) {
                clearInterval(a);
                err.style.opacity = 1;
                err.style.visibility = 'hidden';
            }
        }, 150)
    }, 3000);
    return false;
}