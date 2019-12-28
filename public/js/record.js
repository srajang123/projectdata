let record = document.querySelectorAll('.record');
let host = window.location.protocol + '//' + window.location.host;
record.forEach((rec) => {
    rec.addEventListener('click', () => {
        window.location.href = (host + '/profile/' + rec.children[2].innerHTML);
    });
})