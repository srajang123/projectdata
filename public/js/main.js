var nextImg=document.querySelector('.but');
var img=document.querySelectorAll('.slider');
var i=0;
var imgN=2;
nextImg.addEventListener('click',nextimg);
var nextImgloop=setInterval(nextimg,2000);
function nextimg(){
    img[i].style.display="none";
    i=(i+1)%imgN;
    img[i].style.display="block";
}
