var stickyBlock = $('.header-lg');
var origOffsetY =  $(stickyBlock).offset().top + 132;

function onScroll() {
    if( window.scrollY >= origOffsetY){
        $(stickyBlock).addClass('sticky')
        $(".spacer").css("padding-top", "216px")
    }else{
        $(".spacer").css("padding-top", "0px")
        $(stickyBlock).removeClass('sticky');
    }
}

$(document).on('scroll', onScroll);

if ($(".catagory-container")[0]){
    let url = window.location.href;
    var category = url.substring(url.lastIndexOf('/') + 1);
    category = category.replace("%20%2f%20", "")
    if(category != ""){
        console.log(category)
        $("#" + category).addClass("active")
    }
}


$(document).ready(function() {
    let url = window.location.href;
    if(url.substring(url.lastIndexOf('/') + 1) != ""){
        $(".back-button").show()
    }
});