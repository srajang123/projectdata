exports.OTP = (n) => {
    let otp = 0;
    for (i = 0; i < n; i++) {
        otp *= 10;
        otp += Math.floor(Math.random() * 10);
    }
    return otp;
}