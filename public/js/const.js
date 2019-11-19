var nav=document.querySelector('#hid_nav');
var navi=document.querySelector('#nav');
navi.style.visibility="collapse";
nav.addEventListener('click',(e)=>{
    if(navi.style.visibility=='collapse')
        navi.style.visibility="visible";
    else
        navi.style.visibility="collapse";
});