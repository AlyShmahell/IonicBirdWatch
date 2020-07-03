$(document).ready(function () {
    var collapsed = true;
    if (screen.width <= 480) {
        $(".button").click(function () {
            {
                if (collapsed) {
                    $(".nav").attr("style", "height:300px; margin-top:1vh;");
                    collapsed = false;
                } else {
                    $(".nav").attr("style", "height:0px; margin-top:0;");
                    collapsed = true;
                }
            }
        });
    } else {
        $(".button").click(function () {
            {
                if (collapsed) {
                    $(".nav").attr("style", "width:300px;margin-right:1vw;");
                    collapsed = false;
                } else {
                    $(".nav").attr("style", "width:0px;margin-right:0;");
                    collapsed = true;
                }
            }
        });
    }
});